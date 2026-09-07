/* ============================================================
 * NUSANTARA WIFI V6 — GITHUB PAGES FRONTEND
 * Backend: Google Apps Script Web App
 * ============================================================ */

const API_URL = 'https://script.google.com/macros/s/AKfycbw3xXv41xKe2L2rg3qIaXp_p5wzeSjvotCVrUMgT7SWJiDKBC4rv6DBLeHUkBRsYcQSZg/exec';

async function apiGet(action, params = {}) {
  const query = new URLSearchParams({ action, ...params });
  const response = await fetch(API_URL + '?' + query.toString(), { method: 'GET', cache: 'no-store' });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch (e) { throw new Error('Respons backend bukan JSON. Pastikan URL Web App Apps Script benar dan aksesnya diatur untuk pengguna yang sesuai.'); }
  if (!response.ok || data.success === false) throw new Error(data.message || 'Request backend gagal.');
  return data.data !== undefined ? data.data : data;
}

async function apiPost(action, payload = {}) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload })
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch (e) { throw new Error('Respons backend bukan JSON. Pastikan URL Web App Apps Script benar dan aksesnya diatur untuk pengguna yang sesuai.'); }
  if (!response.ok || data.success === false) throw new Error(data.message || 'Request backend gagal.');
  return data.data !== undefined ? data.data : data;
}

'use strict';

const APP = {
  pelanggan: [],
  tagihan: [],
  pembayaran: [],
  auditLog: [],
  pengaturan: {},
  currentPage: 'dashboard'
};

const PAGE_META = {
  dashboard: ['OVERVIEW','Dashboard'],
  tagihan: ['BILLING','Tagihan'],
  pelanggan: ['CUSTOMERS','Pelanggan'],
  pembayaran: ['PAYMENTS','Pembayaran'],
  histori: ['AUDIT TRAIL','Histori']
};

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  setDefaultPeriods();
  loadInitialData();
});

function $(id){ return document.getElementById(id); }

function bindEvents(){
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
  });

  document.querySelectorAll('[data-page-link]').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.pageLink));
  });

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  $('mobileMenu').addEventListener('click', () => $('sidebar').classList.toggle('open'));
  $('refreshBtn').addEventListener('click', loadInitialData);

  $('heroAddCustomer').addEventListener('click', () => openCustomerModal());
  $('newCustomerBtn').addEventListener('click', () => openCustomerModal());
  $('quickCustomer').addEventListener('click', () => openCustomerModal());

  $('heroGenerate').addEventListener('click', openGenerateModal);
  $('newBillBtn').addEventListener('click', openGenerateModal);
  $('quickBill').addEventListener('click', openGenerateModal);

  $('quickPayment').addEventListener('click', () => {
    const unpaid = APP.tagihan.find(b => b['Status'] === 'Belum Bayar');
    if (!unpaid) return toast('Tidak ada tagihan yang belum lunas.', true);
    openPaymentModal(unpaid._rowIndex);
  });

  $('customerForm').addEventListener('submit', saveCustomer);
  $('deleteCustomerBtn').addEventListener('click', deleteCurrentCustomer);
  $('paymentForm').addEventListener('submit', savePayment);
  $('confirmGenerate').addEventListener('click', generateBills);

  $('customerSearch').addEventListener('input', renderCustomers);
  $('customerStatus').addEventListener('change', renderCustomers);

  $('billSearch').addEventListener('input', renderBills);
  $('billStatus').addEventListener('change', renderBills);
  $('billPeriod').addEventListener('change', renderBills);
}

function setDefaultPeriods(){
  const period = periodNow();
  $('billPeriod').value = period;
  $('generatePeriod').value = period;
}

function periodNow(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
}

function loadInitialData(){
  setConnection('loading');
  if (!API_URL || API_URL.includes('PASTE_YOUR_APPS_SCRIPT')) {
    setConnection('bad');
    $('loadingScreen').classList.add('hidden');
    $('appShell').classList.remove('hidden');
    toast('API_URL belum diisi. Buka js/app.js lalu isi URL Web App Apps Script.', true);
    renderAll();
    return;
  }
  apiGet('getInitialData')
    .then(data => {
      APP.pelanggan = Array.isArray(data?.pelanggan) ? data.pelanggan : [];
      APP.tagihan = Array.isArray(data?.tagihan) ? data.tagihan : [];
      APP.pembayaran = Array.isArray(data?.pembayaran) ? data.pembayaran : [];
      APP.auditLog = Array.isArray(data?.auditLog) ? data.auditLog : [];
      APP.pengaturan = data?.pengaturan || {};
      renderAll();
      setConnection('ok');
      $('loadingScreen').classList.add('hidden');
      $('appShell').classList.remove('hidden');
    })
    .catch(err => {
      console.error(err);
      setConnection('bad');
      $('loadingScreen').classList.add('hidden');
      $('appShell').classList.remove('hidden');
      toast('Gagal memuat data: ' + errorMessage(err), true);
      renderAll();
    });
}

function renderAll(){
  renderDashboard();
  renderBills();
  renderCustomers();
  renderPayments();
  renderAudit();
}

function showPage(page){
  if (!PAGE_META[page]) return;

  APP.currentPage = page;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  $('page-' + page).classList.add('active');

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  $('pageEyebrow').textContent = PAGE_META[page][0];
  $('pageTitle').textContent = PAGE_META[page][1];

  $('sidebar').classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
}

/* =========================
 * DASHBOARD
 * ========================= */

function renderDashboard(){
  const active = APP.pelanggan.filter(x => x['Status'] === 'Aktif');

  // Hanya pelanggan aktif yang boleh masuk ke monitoring tagihan
  const activeCustomerIds = new Set(
    active.map(x => String(x['ID Pelanggan']))
  );

  const period = $('billPeriod')?.value || periodNow();

  // Hanya tagihan milik pelanggan aktif
  const bills = APP.tagihan.filter(x =>
    String(x['Periode']) === String(period) &&
    activeCustomerIds.has(String(x['ID Pelanggan']))
  );

  const unpaid = bills.filter(x => x['Status'] !== 'Lunas');
  const paid = bills.filter(x => x['Status'] === 'Lunas');

  $('statCustomers').textContent = active.length;

  $('statBills').textContent = bills.length;

  $('statOutstanding').textContent = money(
    unpaid.reduce((s, x) => s + Number(x['Nominal'] || 0), 0)
  );

  $('statPaid').textContent = money(
    paid.reduce((s, x) => s + Number(x['Nominal'] || 0), 0)
  );

  const rows = unpaid.slice(0, 6);

  $('dashboardOutstanding').innerHTML = rows.length
    ? `
      <table class="data-table">
        <thead>
          <tr>
            <th>PELANGGAN</th>
            <th>JATUH TEMPO</th>
            <th>NOMINAL</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(b => billRow(b, true)).join('')}
        </tbody>
      </table>
    `
    : `
      <div class="empty">
        Tidak ada tagihan yang perlu perhatian.
      </div>
    `;
}

/* =========================
 * CUSTOMERS
 * ========================= */

function renderCustomers(){
  const q = String($('customerSearch').value || '').toLowerCase().trim();
  const status = $('customerStatus').value;

  const list = APP.pelanggan.filter(c => {
    const haystack = [
      c['ID Pelanggan'], c['Nama Pelanggan'], c['No WhatsApp'],
      c['Paket Speed'], c['Alamat'], c['Catatan']
    ].join(' ').toLowerCase();

    return (!q || haystack.includes(q)) &&
           (!status || c['Status'] === status);
  });

  const grid = $('customerGrid');
  $('customerEmpty').classList.toggle('hidden', list.length !== 0);

  if (!list.length) {
    grid.innerHTML = '';
    return;
  }

  grid.innerHTML = list.map(c => {
    const active = c['Status'] === 'Aktif';
    const initials = initialsOf(c['Nama Pelanggan']);

    return `
      <article class="customer-card">
        <div class="customer-top">
          <div class="customer-avatar">${esc(initials)}</div>
          <span class="badge ${active ? 'badge-active':'badge-inactive'}">
            ${active ? 'Aktif':'Nonaktif'}
          </span>
        </div>

        <div class="customer-name">${esc(c['Nama Pelanggan'])}</div>
        <div class="customer-id">${esc(c['ID Pelanggan'])}</div>

        <div class="customer-info">
          <div class="info-row">
            <span>Paket</span>
            <span>${esc(c['Paket Speed'] || '-')}</span>
          </div>
          <div class="info-row">
            <span>Tarif</span>
            <span>${money(c['Tarif Bulanan'])}</span>
          </div>
          <div class="info-row">
            <span>WhatsApp</span>
            <span>${esc(c['No WhatsApp'] || '-')}</span>
          </div>
          <div class="info-row">
            <span>Alamat</span>
            <span>${esc(shortText(c['Alamat'], 28) || '-')}</span>
          </div>
        </div>

        <div class="customer-actions">
          <button class="btn btn-soft btn-mini" onclick="openCustomerDetail(${Number(c._rowIndex)})">Detail</button>
          <button class="btn btn-success btn-mini" onclick="sendCustomerWA(${Number(c._rowIndex)})">WhatsApp</button>
          <button class="btn btn-soft btn-mini" onclick="openEditCustomer(${Number(c._rowIndex)})">Edit</button>
        </div>
      </article>`;
  }).join('');
}

function openCustomerModal(rowIndex=null){
  $('customerForm').reset();
  $('customerRowIndex').value = '';
  $('customerModalTitle').textContent = 'Pelanggan Baru';
  $('customerSaveBtn').textContent = 'Simpan pelanggan';
  $('deleteCustomerBtn').classList.add('hidden');

  $('fStatus').value = 'Aktif';
  $('fTanggal').value = todayInput();

  if (rowIndex) {
    const c = findCustomerByRow(rowIndex);
    if (!c) return;

    $('customerRowIndex').value = c._rowIndex;
    $('customerModalTitle').textContent = 'Edit Pelanggan';
    $('customerSaveBtn').textContent = 'Simpan perubahan';
    $('deleteCustomerBtn').classList.remove('hidden');

    $('fNama').value = c['Nama Pelanggan'] || '';
    $('fWhatsApp').value = c['No WhatsApp'] || '';
    $('fPaket').value = c['Paket Speed'] || '';
    $('fTarif').value = num(c['Tarif Bulanan']);
    $('fTanggal').value = dateInput(c['Tanggal Pasang']);
    $('fStatus').value = c['Status'] || 'Aktif';
    $('fAlamat').value = c['Alamat'] || '';
    $('fCatatan').value = c['Catatan'] || '';
  }

  $('customerModal').classList.remove('hidden');
}

function openEditCustomer(rowIndex){
  openCustomerModal(rowIndex);
}

function saveCustomer(e){
  e.preventDefault();

  const data = {
    rowIndex: Number($('customerRowIndex').value) || null,
    nama: $('fNama').value.trim(),
    noWhatsApp: $('fWhatsApp').value.trim(),
    paketSpeed: $('fPaket').value.trim(),
    tarifBulanan: Number($('fTarif').value || 0),
    tanggalPasang: $('fTanggal').value,
    status: $('fStatus').value,
    alamat: $('fAlamat').value.trim(),
    catatan: $('fCatatan').value.trim()
  };

  if (!data.nama) return toast('Nama pelanggan wajib diisi.', true);
  if (!data.noWhatsApp) return toast('Nomor WhatsApp wajib diisi.', true);
  if (data.tarifBulanan < 0) return toast('Tarif bulanan tidak valid.', true);

  const button = $('customerSaveBtn');
  button.disabled = true;

  const action = data.rowIndex ? 'updateCustomer' : 'addCustomer';
  apiPost(action, data)
    .then(result => {
      button.disabled = false;
      closeModal('customerModal');
      toast(result?.message || 'Data tersimpan.');
      loadInitialData();
    })
    .catch(err => {
      button.disabled = false;
      toast(errorMessage(err), true);
    });
}

function deleteCurrentCustomer(){
  const rowIndex = Number($('customerRowIndex').value);
  if (!rowIndex) return;

  const customer = findCustomerByRow(rowIndex);
  if (!customer) return toast('Data pelanggan tidak ditemukan.', true);

  const name = customer['Nama Pelanggan'] || 'pelanggan ini';

  const confirmed = confirm(
    'Hapus ' + name + '?\\n\\n' +
    'Data pelanggan akan dihapus dari daftar pelanggan.\\n' +
    'Histori tagihan dan pembayaran TIDAK akan dihapus.'
  );

  if (!confirmed) return;

  const button = $('deleteCustomerBtn');
  button.disabled = true;

  apiPost('deleteCustomer', { rowIndex })
    .then(result => {
      button.disabled = false;
      closeModal('customerModal');
      toast(result?.message || 'Pelanggan berhasil dihapus.');
      loadInitialData();
    })
    .catch(err => {
      button.disabled = false;
      toast(errorMessage(err), true);
    });
}

function toggleCustomer(rowIndex,status){
  apiPost('updateCustomerStatus', { rowIndex, status })
    .then(result => {
      toast(result?.message || 'Status diperbarui.');
      loadInitialData();
    })
    .catch(err => toast(errorMessage(err), true));
}

function openCustomerDetail(rowIndex){
  const c = findCustomerByRow(rowIndex);
  if (!c) return;

  $('detailName').textContent = c['Nama Pelanggan'] || 'Detail Pelanggan';

  const bills = APP.tagihan
    .filter(b => b['ID Pelanggan'] === c['ID Pelanggan'])
    .sort((a,b) => String(b['Periode']).localeCompare(String(a['Periode'])));

  const payments = APP.pembayaran
    .filter(p => p['ID Pelanggan'] === c['ID Pelanggan'])
    .sort((a,b) => String(b['Tanggal Bayar']).localeCompare(String(a['Tanggal Bayar'])));

  $('detailContent').innerHTML = `
    <div class="detail-hero">
      <div class="detail-avatar">${esc(initialsOf(c['Nama Pelanggan']))}</div>
      <div>
        <div class="detail-name">${esc(c['Nama Pelanggan'])}</div>
        <div class="detail-sub">${esc(c['ID Pelanggan'])} · ${esc(c['Status'])}</div>
      </div>
      <div class="detail-actions">
        <button class="btn btn-success btn-mini" onclick="sendCustomerWA(${Number(c._rowIndex)})">WhatsApp</button>
        <button class="btn btn-soft btn-mini" onclick="closeModal('detailModal');openEditCustomer(${Number(c._rowIndex)})">Edit</button>
      </div>
    </div>

    <div class="detail-section">
      <h4>Informasi pelanggan</h4>
      <div class="detail-grid">
        <div class="detail-box"><span>WhatsApp</span><strong>${esc(c['No WhatsApp'] || '-')}</strong></div>
        <div class="detail-box"><span>Paket</span><strong>${esc(c['Paket Speed'] || '-')}</strong></div>
        <div class="detail-box"><span>Tarif bulanan</span><strong>${money(c['Tarif Bulanan'])}</strong></div>
        <div class="detail-box"><span>Tanggal pasang</span><strong>${dateShort(c['Tanggal Pasang'])}</strong></div>
        <div class="detail-box"><span>Alamat</span><strong>${esc(c['Alamat'] || '-')}</strong></div>
        <div class="detail-box"><span>Catatan</span><strong>${esc(c['Catatan'] || '-')}</strong></div>
      </div>
    </div>

    <div class="detail-section">
      <h4>Riwayat tagihan</h4>
      ${
        bills.length
        ? bills.slice(0,8).map(b => `
          <div class="detail-bill">
            <div class="detail-bill-main">
              <strong>${esc(b['Periode'])} · ${money(b['Nominal'])}</strong>
              <span>${esc(b['ID Tagihan'])} · jatuh tempo ${dateShort(b['Jatuh Tempo'])}</span>
            </div>
            <span class="badge ${b['Status']==='Lunas'?'badge-paid':'badge-unpaid'}">${esc(b['Status'])}</span>
          </div>`).join('')
        : '<div class="muted-text">Belum ada histori tagihan.</div>'
      }
    </div>

    <div class="detail-section">
      <h4>Riwayat pembayaran</h4>
      ${
        payments.length
        ? payments.slice(0,8).map(p => `
          <div class="detail-bill">
            <div class="detail-bill-main">
              <strong>${money(p['Nominal'])} · ${esc(p['Metode'])}</strong>
              <span>${esc(p['Periode'])} · ${dateShort(p['Tanggal Bayar'])}</span>
            </div>
          </div>`).join('')
        : '<div class="muted-text">Belum ada pembayaran.</div>'
      }
    </div>
  `;

  $('detailModal').classList.remove('hidden');
}

/* =========================
 * BILLING
 * ========================= */

function renderBills(){
  const q = ($('billSearch')?.value || '').toLowerCase().trim();
  const period = $('billPeriod')?.value || periodNow();
  const status = $('billStatus')?.value || '';

  const activeCustomerIds = new Set(
    APP.pelanggan
      .filter(x => x['Status'] === 'Aktif')
      .map(x => String(x['ID Pelanggan']))
  );

  const data = APP.tagihan.filter(x => {
    const customerActive = activeCustomerIds.has(String(x['ID Pelanggan']));
    const hay = [x['ID Tagihan'], x['ID Pelanggan'], x['Nama']].join(' ').toLowerCase();
    return customerActive &&
      String(x['Periode']) === String(period) &&
      (!q || hay.includes(q)) &&
      (!status || x['Status'] === status);
  });

  const tbody = $('billTableBody');
  const empty = $('billEmpty');
  if (!tbody || !empty) return;

  tbody.innerHTML = data.map(b => billRow(b, false)).join('');
  empty.classList.toggle('hidden', data.length > 0);
}

function openPaymentModal(rowIndex){
  const b = findBillByRow(rowIndex);
  if (!b) return;

  $('paymentRowIndex').value = b._rowIndex;
  $('paymentMethod').value = 'Tunai';
  $('paymentNote').value = '';

  $('paymentSummary').innerHTML = `
    <strong>${esc(b['Nama'])}</strong>
    <span>${esc(b['ID Tagihan'])} · ${esc(b['Periode'])} · ${money(b['Nominal'])}</span>
  `;

  $('paymentModal').classList.remove('hidden');
}

function savePayment(e){
  e.preventDefault();

  const row = Number($('paymentRowIndex').value);
  const method = $('paymentMethod').value;
  const note = $('paymentNote').value.trim();

  const button = $('paymentSaveBtn');
  button.disabled = true;

  apiPost('payBill', { rowIndex: row, method, note })
    .then(result => {
      button.disabled = false;
      closeModal('paymentModal');
      toast(result?.message || 'Pembayaran tersimpan.');
      loadInitialData();
    })
    .catch(err => {
      button.disabled = false;
      toast(errorMessage(err), true);
    });
}

function openGenerateModal(){
  $('generatePeriod').value = $('billPeriod').value || periodNow();
  $('generateModal').classList.remove('hidden');
}

function generateBills(){
  const period = $('generatePeriod').value;
  if (!period) return toast('Pilih periode terlebih dahulu.', true);

  const button = $('confirmGenerate');
  button.disabled = true;

  apiPost('generateMonthlyBills', { requestedPeriod: period })
    .then(result => {
      button.disabled = false;
      closeModal('generateModal');
      toast(result?.message || 'Tagihan berhasil dibuat.');
      $('billPeriod').value = period;
      loadInitialData();
    })
    .catch(err => {
      button.disabled = false;
      toast(errorMessage(err), true);
    });
}

/* =========================
 * WHATSAPP
 * ========================= */

function normalizeWA(phone){
  let value = String(phone || '').replace(/\D/g,'');
  if (!value) return '';

  if (value.startsWith('0')) value = '62' + value.substring(1);
  else if (value.startsWith('8')) value = '62' + value;

  return value;
}

function buildBillMessage(bill, customer){
  const biz = APP.pengaturan.NAMA_BISNIS || 'Nusantara WiFi';
  const manager = APP.pengaturan.NAMA_PENGELOLA || '';
  const due = dateShort(bill['Jatuh Tempo']);
  const bank = APP.pengaturan.BANK || '';
  const account = APP.pengaturan.NO_REKENING || '';
  const ewallet = APP.pengaturan.E_WALLET || '';
  const address = APP.pengaturan.ALAMAT || '';

  let paymentInfo = '';
  if (bank && account) paymentInfo += `\nTransfer ${bank}: ${account}`;
  if (ewallet) paymentInfo += `\nE-Wallet: ${ewallet}`;

  return `Halo ${customer?.['Nama Pelanggan'] || bill['Nama']},

Salam dari ${biz}${manager ? ' - ' + manager : ''}.

Berikut informasi tagihan WiFi:

ID Tagihan: ${bill['ID Tagihan']}
Periode: ${bill['Periode']}
Paket: ${customer?.['Paket Speed'] || '-'}
Nominal: ${money(bill['Nominal'])}
Jatuh tempo: ${due}
Status: ${bill['Status']}
${paymentInfo}

Mohon melakukan pembayaran sebelum jatuh tempo.

Terima kasih.${address ? '\n\n' + address : ''}`;
}

function sendCustomerWA(rowIndex){
  const customer = findCustomerByRow(rowIndex);
  if (!customer) return;

  const phone = normalizeWA(customer['No WhatsApp']);
  if (!phone) return toast('Nomor WhatsApp pelanggan belum tersedia.', true);

  const currentPeriod = $('billPeriod').value || periodNow();

  let bill = APP.tagihan.find(b =>
    b['ID Pelanggan'] === customer['ID Pelanggan'] &&
    String(b['Periode']) === String(currentPeriod)
  );

  if (!bill) {
    bill = APP.tagihan
      .filter(b => b['ID Pelanggan'] === customer['ID Pelanggan'])
      .sort((a,b) => String(b['Periode']).localeCompare(String(a['Periode'])))[0];
  }

  if (!bill) {
    const message =
      `Halo ${customer['Nama Pelanggan']},

Salam dari ${APP.pengaturan.NAMA_BISNIS || 'Nusantara WiFi'}.

Kami ingin menginformasikan bahwa tagihan Anda belum tersedia di sistem.

Terima kasih.`;
    return sendWA(phone, message);
  }

  sendWA(phone, buildBillMessage(bill, customer));
}

function sendBillWA(rowIndex){
  const bill = findBillByRow(rowIndex);
  if (!bill) return;

  const customer = findCustomer(bill['ID Pelanggan']);
  if (!customer) return toast('Data pelanggan untuk tagihan ini tidak ditemukan.', true);

  const phone = normalizeWA(customer['No WhatsApp']);
  if (!phone) return toast('Nomor WhatsApp pelanggan belum tersedia.', true);

  sendWA(phone, buildBillMessage(bill, customer));
}

function sendWA(phone, message){
  if (!phone) return toast('Nomor WhatsApp belum tersedia.', true);

  const url = 'https://wa.me/' + phone + '?text=' +
    encodeURIComponent(message || '');

  window.open(url, '_blank', 'noopener');
}

/* =========================
 * PAYMENTS
 * ========================= */

function renderPayments(){
  const list = APP.pembayaran
    .slice()
    .sort((a,b) => String(b['Tanggal Bayar']).localeCompare(String(a['Tanggal Bayar'])));

  $('paymentEmpty').classList.toggle('hidden', list.length !== 0);

  $('paymentTableBody').innerHTML = list.map(p => `
    <tr>
      <td><span class="primary-text">${esc(p['ID Pembayaran'])}</span></td>
      <td>
        <div class="primary-text">${esc(p['Nama Pelanggan'])}</div>
        <div class="muted-text">${esc(p['ID Pelanggan'])}</div>
      </td>
      <td>${esc(p['Periode'])}</td>
      <td class="money">${money(p['Nominal'])}</td>
      <td>${dateShort(p['Tanggal Bayar'])}</td>
      <td>${esc(p['Metode'])}</td>
    </tr>
  `).join('');
}

/* =========================
 * AUDIT
 * ========================= */

function renderAudit(){
  const list = APP.auditLog
    .slice()
    .sort((a,b) => String(b['Timestamp']).localeCompare(String(a['Timestamp'])));

  $('auditEmpty').classList.toggle('hidden', list.length !== 0);

  $('auditList').innerHTML = list.slice(0,100).map(a => `
    <div class="audit-item">
      <div class="audit-dot"></div>
      <div class="audit-main">
        <div class="audit-title">${esc(a['Action'] || 'ACTIVITY')} · ${esc(a['Reference'] || '')}</div>
        <div class="audit-desc">${esc(a['Description'] || '')}</div>
        <div class="audit-time">${esc(a['User'] || 'User')} · ${dateTimeShort(a['Timestamp'])}</div>
      </div>
    </div>
  `).join('');
}

/* =========================
 * HELPERS
 * ========================= */

function findCustomer(id){
  return APP.pelanggan.find(c => String(c['ID Pelanggan']) === String(id));
}

function findCustomerByRow(rowIndex){
  return APP.pelanggan.find(c => Number(c._rowIndex) === Number(rowIndex));
}

function findBillByRow(rowIndex){
  return APP.tagihan.find(b => Number(b._rowIndex) === Number(rowIndex));
}

function initialsOf(name){
  const words = String(name || '?').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return (words[0][0] + (words.length > 1 ? words[words.length-1][0] : '')).toUpperCase();
}

function shortText(value,max){
  const s = String(value || '');
  return s.length > max ? s.substring(0,max-1) + '…' : s;
}

function num(value){
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function money(value){
  return 'Rp' + Math.round(num(value)).toLocaleString('id-ID');
}

function dateShort(value){
  if (!value) return '-';
  const d = new Date(String(value).replace(' ','T'));
  if (isNaN(d.getTime())) return String(value).substring(0,10);
  return d.toLocaleDateString('id-ID',{
    day:'2-digit',month:'short',year:'numeric'
  });
}

function dateTimeShort(value){
  if (!value) return '-';
  const d = new Date(String(value).replace(' ','T'));
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString('id-ID',{
    day:'2-digit',month:'short',year:'numeric',
    hour:'2-digit',minute:'2-digit'
  });
}

function dateInput(value){
  if (!value) return '';
  return String(value).substring(0,10);
}

function todayInput(){
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth()+1).padStart(2,'0') + '-' +
    String(d.getDate()).padStart(2,'0');
}

function esc(value){
  return String(value ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

function errorMessage(err){
  return String(err?.message || err || 'Terjadi kesalahan.');
}

function closeModal(id){
  const el = $(id);
  if (el) el.classList.add('hidden');
}

function setConnection(state){
  const dot = $('connectionDot');
  const text = $('connectionText');

  dot.classList.remove('ok','bad');

  if (state === 'ok') {
    dot.classList.add('ok');
    text.textContent = 'Terhubung';
  } else if (state === 'bad') {
    dot.classList.add('bad');
    text.textContent = 'Koneksi bermasalah';
  } else {
    text.textContent = 'Memuat data...';
  }
}

let toastTimer;

function toast(message,error=false){
  const t = $('toast');
  t.textContent = message;
  t.style.background = error ? '#a87178' : '#34465b';
  t.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}
