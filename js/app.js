/* ============================================================
 * NUSANTARA WIFI V6.2 — GITHUB PAGES FRONTEND
 * Backend: Google Apps Script Web App
 * ============================================================ */
'use strict';

const API_URL = 'https://script.google.com/macros/s/AKfycbw3xXv41xKe2Lrg3qIaXp_p5wzeSjvotCVrUMgT7SWJiDKBC4rv6DBLeHUkBRsYcQSZg/exec';
const APP = { pelanggan:[], tagihan:[], pembayaran:[], auditLog:[], pengaturan:{}, currentPage:'dashboard' };
const PAGE_META = { dashboard:['OVERVIEW','Dashboard'], tagihan:['BILLING','Tagihan'], pelanggan:['CUSTOMERS','Pelanggan'], pembayaran:['PAYMENTS','Pembayaran'], histori:['AUDIT TRAIL','Histori'], attendance:['PEOPLE','Absensi'], payroll:['PEOPLE','Payroll'] };

async function apiGet(action, params={}) {
  const query = new URLSearchParams({action, ...params});
  const response = await fetch(API_URL + '?' + query.toString(), {method:'GET', cache:'no-store'});
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch(e) { throw new Error('Respons backend bukan JSON.'); }
  if (!response.ok || data.success === false) throw new Error(data.message || 'Request backend gagal.');
  return data.data !== undefined ? data.data : data;
}

async function apiPost(action, payload={}) {
  const response = await fetch(API_URL, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({action,...payload})});
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch(e) { throw new Error('Respons backend bukan JSON.'); }
  if (!response.ok || data.success === false) throw new Error(data.message || 'Request backend gagal.');
  return data.data !== undefined ? data.data : data;
}

function $(id){ return document.getElementById(id); }
function periodKey(value){
  if (!value) return '';
  const s=String(value).trim();
  const m=s.match(/^(\d{4})-(\d{2})/);
  return m ? m[1]+'-'+m[2] : s;
}
function periodNow(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }

window.addEventListener('DOMContentLoaded',()=>{
  try { bindEvents(); setDefaultPeriods(); loadInitialData(); }
  catch(e){ console.error(e); showFatalError('Frontend gagal diinisialisasi: '+errorMessage(e)); }
});

function bindEvents(){
  document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
  document.querySelectorAll('[data-page-link]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.pageLink)));
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
  $('mobileMenu')?.addEventListener('click',()=>$('sidebar')?.classList.toggle('open'));
  $('refreshBtn')?.addEventListener('click',loadInitialData);
  $('heroAddCustomer')?.addEventListener('click',()=>openCustomerModal());
  $('newCustomerBtn')?.addEventListener('click',()=>openCustomerModal());
  $('quickCustomer')?.addEventListener('click',()=>openCustomerModal());
  $('heroGenerate')?.addEventListener('click',openGenerateModal);
  $('newBillBtn')?.addEventListener('click',openGenerateModal);
  $('quickBill')?.addEventListener('click',openGenerateModal);
  $('quickPayment')?.addEventListener('click',()=>{const b=APP.tagihan.find(x=>x.Status==='Belum Bayar'&&isBillOperational(x));if(!b)return toast('Tidak ada tagihan aktif yang belum lunas.',true);openPaymentModal(b._rowIndex);});
  $('customerForm')?.addEventListener('submit',saveCustomer);
  $('deleteCustomerBtn')?.addEventListener('click',deleteCurrentCustomer);
  $('paymentForm')?.addEventListener('submit',savePayment);
  $('confirmGenerate')?.addEventListener('click',generateBills);
  $('customerSearch')?.addEventListener('input',renderCustomers);
  $('customerStatus')?.addEventListener('change',renderCustomers);
  $('billSearch')?.addEventListener('input',renderBills);
  $('billStatus')?.addEventListener('change',renderBills);
  $('billPeriod')?.addEventListener('change',()=>{renderBills();renderDashboard();});
}
function setDefaultPeriods(){const p=periodNow();if($('billPeriod'))$('billPeriod').value=p;if($('generatePeriod'))$('generatePeriod').value=p;}
async function loadInitialData(){
  setConnection('loading');$('loadingScreen')?.classList.remove('hidden');$('appShell')?.classList.add('hidden');
  try{const data=await apiGet('getInitialData');APP.pelanggan=Array.isArray(data?.pelanggan)?data.pelanggan:[];APP.tagihan=Array.isArray(data?.tagihan)?data.tagihan:[];APP.pembayaran=Array.isArray(data?.pembayaran)?data.pembayaran:[];APP.auditLog=Array.isArray(data?.auditLog)?data.auditLog:[];APP.pengaturan=data?.pengaturan||{};renderAll();setConnection('ok');}
  catch(e){console.error(e);setConnection('bad');toast('Gagal memuat data: '+errorMessage(e),true);}
  finally{$('loadingScreen')?.classList.add('hidden');$('appShell')?.classList.remove('hidden');}
}
function renderAll(){renderDashboard();renderBills();renderCustomers();renderPayments();renderAudit();}
function showPage(page){if(!PAGE_META[page])return;APP.currentPage=page;document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$('page-'+page)?.classList.add('active');document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page));if($('pageEyebrow'))$('pageEyebrow').textContent=PAGE_META[page][0];if($('pageTitle'))$('pageTitle').textContent=PAGE_META[page][1];$('sidebar')?.classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});}
window.showPage=showPage;
function activeCustomerMap(){const map=new Map();APP.pelanggan.forEach(c=>{if(String(c.Status)==='Aktif')map.set(String(c['ID Pelanggan']),c);});return map;}
function getActiveCustomerIds(){return new Set(activeCustomerMap().keys());}
function findCustomer(id){return APP.pelanggan.find(c=>String(c['ID Pelanggan'])===String(id));}
function findCustomerByRow(row){return APP.pelanggan.find(c=>Number(c._rowIndex)===Number(row));}
function findBillByRow(row){return APP.tagihan.find(b=>Number(b._rowIndex)===Number(row));}
function isBillOperational(b){const c=findCustomer(b['ID Pelanggan']);return !!c&&String(c.Status)==='Aktif';}

function renderDashboard(){
  const active=APP.pelanggan.filter(c=>String(c.Status)==='Aktif'),ids=new Set(active.map(c=>String(c['ID Pelanggan']))),period=$('billPeriod')?.value||periodNow();
  const bills=APP.tagihan.filter(b=>ids.has(String(b['ID Pelanggan']))&&periodKey(b['Periode'])===period),unpaid=bills.filter(b=>b.Status!=='Lunas'),paid=bills.filter(b=>b.Status==='Lunas');
  $('statCustomers').textContent=active.length;$('statBills').textContent=bills.length;$('statOutstanding').textContent=money(unpaid.reduce((s,b)=>s+num(b.Nominal),0));$('statPaid').textContent=money(paid.reduce((s,b)=>s+num(b.Nominal),0));
  $('dashboardOutstanding').innerHTML=unpaid.length?`<div class="list-stack">${unpaid.slice(0,6).map(b=>billRow(b,true)).join('')}</div>`:'<div class="empty-state"><div class="empty-icon">✓</div><strong>Semua tagihan aman</strong><span>Tidak ada tagihan aktif yang perlu ditindaklanjuti.</span></div>';
}
function renderBills(){
  const q=String($('billSearch')?.value||'').toLowerCase().trim(),period=$('billPeriod')?.value||periodNow(),status=$('billStatus')?.value||'',ids=getActiveCustomerIds();
  const list=APP.tagihan.filter(b=>{const hay=[b['ID Tagihan'],b['ID Pelanggan'],b['Nama'],b['Periode']].join(' ').toLowerCase();return ids.has(String(b['ID Pelanggan']))&&periodKey(b['Periode'])===period&&(!q||hay.includes(q))&&(!status||b.Status===status);});
  if(!$('billTableBody'))return;$('billTableBody').innerHTML=list.map(b=>billRow(b,false)).join('');$('billEmpty')?.classList.toggle('hidden',list.length>0);
}
function billRow(b,dashboard=false){
  const customer=findCustomer(b['ID Pelanggan']),name=b['Nama']||customer?.['Nama Pelanggan']||b['ID Pelanggan'],unpaid=b.Status!=='Lunas';
  if(dashboard)return `<div class="outstanding-item"><div><div class="item-name">${esc(name)}</div><div class="item-meta">${esc(periodKey(b.Period))} · jatuh tempo ${dateShort(b['Jatuh Tempo'])}</div></div><div class="item-money">${money(b.Nominal)}<small>Belum bayar</small></div></div>`;
  return `<tr><td><div class="primary-text">${esc(name)}</div><div class="muted-text">${esc(b['ID Pelanggan'])}</div></td><td>${esc(periodKey(b.Period))}</td><td>${dateShort(b['Jatuh Tempo'])}</td><td class="money">${money(b.Nominal)}</td><td><span class="badge ${unpaid?'badge-unpaid':'badge-paid'}">${esc(b.Status)}</span></td><td><div class="table-actions">${unpaid?`<button class="btn btn-primary btn-mini" onclick="openPaymentModal(${Number(b._rowIndex)})">Bayar</button>`:''}<button class="btn btn-success btn-mini" onclick="sendBillWA(${Number(b._rowIndex)})">WA</button></div></td></tr>`;
}

function renderCustomers(){const q=String($('customerSearch')?.value||'').toLowerCase().trim(),status=$('customerStatus')?.value||'';const list=APP.pelanggan.filter(c=>{const hay=[c['ID Pelanggan'],c['Nama Pelanggan'],c['No WhatsApp'],c['Paket Speed'],c['Alamat'],c['Catatan']].join(' ').toLowerCase();return(!q||hay.includes(q))&&(!status||c.Status===status);});$('customerEmpty')?.classList.toggle('hidden',list.length>0);$('customerGrid').innerHTML=list.map(c=>{const active=c.Status==='Aktif';return `<article class="customer-card"><div class="customer-top"><div class="customer-avatar">${esc(initialsOf(c['Nama Pelanggan']))}</div><span class="badge ${active?'badge-active':'badge-inactive'}">${active?'Aktif':'Nonaktif'}</span></div><div class="customer-name">${esc(c['Nama Pelanggan'])}</div><div class="customer-id">${esc(c['ID Pelanggan'])}</div><div class="customer-info"><div class="info-row"><span>Paket</span><span>${esc(c['Paket Speed']||'-')}</span></div><div class="info-row"><span>Tarif</span><span>${money(c['Tarif Bulanan'])}</span></div><div class="info-row"><span>WhatsApp</span><span>${esc(c['No WhatsApp']||'-')}</span></div><div class="info-row"><span>Alamat</span><span>${esc(shortText(c.Alamat,28)||'-')}</span></div></div><div class="customer-actions"><button class="btn btn-soft btn-mini" onclick="openCustomerDetail(${Number(c._rowIndex)})">Detail</button><button class="btn btn-success btn-mini" onclick="sendCustomerWA(${Number(c._rowIndex)})">WhatsApp</button><button class="btn btn-soft btn-mini" onclick="openEditCustomer(${Number(c._rowIndex)})">Edit</button></div></article>`;}).join('');}
function openCustomerModal(row=null){$('customerForm').reset();$('customerRowIndex').value='';$('customerModalTitle').textContent='Pelanggan Baru';$('customerSaveBtn').textContent='Simpan pelanggan';$('deleteCustomerBtn').classList.add('hidden');$('fStatus').value='Aktif';$('fTanggal').value=todayInput();if(row){const c=findCustomerByRow(row);if(!c)return;$('customerRowIndex').value=c._rowIndex;$('customerModalTitle').textContent='Edit Pelanggan';$('customerSaveBtn').textContent='Simpan perubahan';$('deleteCustomerBtn').classList.remove('hidden');$('fNama').value=c['Nama Pelanggan']||'';$('fWhatsApp').value=c['No WhatsApp']||'';$('fPaket').value=c['Paket Speed']||'';$('fTarif').value=num(c['Tarif Bulanan']);$('fTanggal').value=dateInput(c['Tanggal Pasang']);$('fStatus').value=c.Status||'Aktif';$('fAlamat').value=c.Alamat||'';$('fCatatan').value=c.Catatan||'';}$('customerModal').classList.remove('hidden');}
function openEditCustomer(row){openCustomerModal(row);}
function saveCustomer(e){e.preventDefault();const data={rowIndex:Number($('customerRowIndex').value)||null,nama:$('fNama').value.trim(),noWhatsApp:$('fWhatsApp').value.trim(),paketSpeed:$('fPaket').value.trim(),tarifBulanan:Number($('fTarif').value||0),tanggalPasang:$('fTanggal').value,status:$('fStatus').value,alamat:$('fAlamat').value.trim(),catatan:$('fCatatan').value.trim()};if(!data.nama)return toast('Nama pelanggan wajib diisi.',true);if(!data.noWhatsApp)return toast('Nomor WhatsApp wajib diisi.',true);if(data.tarifBulanan<0)return toast('Tarif bulanan tidak valid.',true);const btn=$('customerSaveBtn');btn.disabled=true;apiPost(data.rowIndex?'updateCustomer':'addCustomer',data).then(r=>{toast(r?.message||'Data pelanggan tersimpan.');closeModal('customerModal');loadInitialData();}).catch(err=>toast(errorMessage(err),true)).finally(()=>btn.disabled=false);}
function deleteCurrentCustomer(){const row=Number($('customerRowIndex').value),c=findCustomerByRow(row);if(!c)return;if(!confirm('Hapus '+(c['Nama Pelanggan']||'pelanggan ini')+'?\n\nHistori tagihan dan pembayaran tetap disimpan.'))return;const btn=$('deleteCustomerBtn');btn.disabled=true;apiPost('deleteCustomer',{rowIndex:row}).then(r=>{toast(r?.message||'Pelanggan berhasil dihapus.');closeModal('customerModal');loadInitialData();}).catch(err=>toast(errorMessage(err),true)).finally(()=>btn.disabled=false);}
function openCustomerDetail(row){const c=findCustomerByRow(row);if(!c)return;const bills=APP.tagihan.filter(b=>String(b['ID Pelanggan'])===String(c['ID Pelanggan'])).sort((a,b)=>periodKey(b.Period).localeCompare(periodKey(a.Period)));const payments=APP.pembayaran.filter(p=>String(p['ID Pelanggan'])===String(c['ID Pelanggan'])).sort((a,b)=>String(b['Tanggal Bayar']).localeCompare(String(a['Tanggal Bayar'])));$('detailName').textContent=c['Nama Pelanggan']||'Detail Pelanggan';$('detailContent').innerHTML=`<div class="detail-hero"><div class="detail-avatar">${esc(initialsOf(c['Nama Pelanggan']))}</div><div><div class="detail-name">${esc(c['Nama Pelanggan'])}</div><div class="detail-sub">${esc(c['ID Pelanggan'])} · ${esc(c.Status)}</div></div><div class="detail-actions"><button class="btn btn-success btn-mini" onclick="sendCustomerWA(${Number(c._rowIndex)})">WhatsApp</button><button class="btn btn-soft btn-mini" onclick="closeModal('detailModal');openEditCustomer(${Number(c._rowIndex)})">Edit</button></div></div><div class="detail-section"><h4>Informasi pelanggan</h4><div class="detail-grid"><div class="detail-box"><span>WhatsApp</span><strong>${esc(c['No WhatsApp']||'-')}</strong></div><div class="detail-box"><span>Paket</span><strong>${esc(c['Paket Speed']||'-')}</strong></div><div class="detail-box"><span>Tarif bulanan</span><strong>${money(c['Tarif Bulanan'])}</strong></div><div class="detail-box"><span>Tanggal pasang</span><strong>${dateShort(c['Tanggal Pasang'])}</strong></div><div class="detail-box"><span>Alamat</span><strong>${esc(c.Alamat||'-')}</strong></div><div class="detail-box"><span>Catatan</span><strong>${esc(c.Catatan||'-')}</strong></div></div></div><div class="detail-section"><h4>Riwayat tagihan</h4>${bills.length?bills.slice(0,12).map(b=>`... (rest of existing app.js remains unchanged)`: '<div class="empty-state"><span>Belum ada riwayat tagihan.</span></div>'}</div>`;$('detailModal').classList.remove('hidden');}
