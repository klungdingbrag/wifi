/* ============================================================
 * NUSANTARA BUSINESS — PEOPLE WORKSPACE
 * Phase 04: Absensi & Payroll integration.
 * Read-only: the People backend remains a separate Apps Script.
 * No attendance/payroll write, delete, reset, or mutation is exposed.
 * ============================================================ */
(function(){
  'use strict';
  const KEY='__nusantaraPeopleWorkspace';
  if(window[KEY]?.installed)return;

  const ABSENSI_SCRIPT_URL='https://script.google.com/macros/s/AKfycbwjpeYThkyGewyR8PAY8SxkGPM32-zWkAVniJfzPcLk2yrztpjQPPCECJF3ApKck41_kg/exec';
  const DAY_NAMES=['minggu','senin','selasa','rabu','kamis','jumat','sabtu'];
  const state={installed:false,loading:false,lastSuccess:null,lastError:null,weekStart:null,data:[]};

  function css(){
    if(document.getElementById('peopleWorkspaceStyle'))return;
    const s=document.createElement('style');s.id='peopleWorkspaceStyle';
    s.textContent=`
      .people-shell{display:grid;gap:16px}.people-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;background:var(--surface,#fff);border:1px solid var(--border,#e3eaf1);border-radius:18px;padding:22px;box-shadow:0 8px 24px rgba(20,45,70,.05)}.people-kicker{font-size:11px;font-weight:800;letter-spacing:.08em;color:var(--muted,#718096)}.people-head h2{margin:5px 0 7px;font-size:25px;letter-spacing:-.02em}.people-head p{margin:0;color:var(--muted,#718096);line-height:1.55;max-width:760px}.people-actions{display:flex;gap:8px;flex-wrap:wrap}.people-toolbar,.people-card{background:var(--surface,#fff);border:1px solid var(--border,#e3eaf1);border-radius:16px;padding:16px;box-shadow:0 7px 20px rgba(20,45,70,.04)}.people-toolbar{display:flex;align-items:end;justify-content:space-between;gap:12px}.people-field{display:grid;gap:5px}.people-field label{font-size:11px;font-weight:700;color:var(--muted,#718096)}.people-field input{height:38px;border:1px solid var(--border,#dbe3eb);border-radius:10px;padding:0 10px;background:var(--surface,#fff);color:var(--text,#263548)}.people-status{font-size:12px;color:var(--muted,#718096)}.people-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.people-kpi{background:var(--surface,#fff);border:1px solid var(--border,#e3eaf1);border-radius:15px;padding:16px}.people-kpi span{display:block;font-size:11px;color:var(--muted,#718096);font-weight:700}.people-kpi strong{display:block;margin-top:5px;font-size:22px}.people-table-wrap{overflow:auto}.people-table{width:100%;border-collapse:collapse;min-width:780px}.people-table th,.people-table td{padding:11px 10px;border-bottom:1px solid var(--border,#e6edf3);text-align:left;font-size:12px}.people-table th{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted,#718096);background:var(--bg-soft,#f6f8fb);position:sticky;top:0}.people-table td.num{text-align:right}.people-table .total{font-weight:800}.people-note{padding:13px 15px;border-radius:12px;background:linear-gradient(135deg,rgba(23,184,220,.07),rgba(88,125,165,.07));border:1px solid var(--border,#e3eaf1);font-size:12px;color:var(--muted,#718096);line-height:1.55}.people-error{padding:14px;border-radius:12px;border:1px solid rgba(173,115,125,.35);background:rgba(173,115,125,.08);color:var(--danger,#ad737d);font-size:12px}.people-empty{padding:26px;text-align:center;color:var(--muted,#718096)}[data-theme="dark"] .people-head,[data-theme="dark"] .people-toolbar,[data-theme="dark"] .people-card,[data-theme="dark"] .people-kpi{box-shadow:0 10px 28px rgba(0,0,0,.16)}@media(max-width:900px){.people-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.people-head{flex-direction:column}.people-toolbar{align-items:stretch;flex-direction:column}}@media(max-width:520px){.people-kpis{grid-template-columns:1fr}.people-head,.people-toolbar,.people-card{padding:14px}.people-head h2{font-size:21px}}
    `;document.head.appendChild(s);
  }

  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function money(n){return 'Rp '+new Intl.NumberFormat('id-ID').format(Math.round(Number(n)||0))}
  function dateKey(d){return d.toISOString().slice(0,10)}
  function weekStart(date=new Date()){
    const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());d.setDate(d.getDate()-d.getDay());return dateKey(d)
  }
  function weekEnd(start){const d=new Date(start+'T00:00:00');d.setDate(d.getDate()+6);return dateKey(d)}
  function addDays(start,n){const d=new Date(start+'T00:00:00');d.setDate(d.getDate()+n);return dateKey(d)}
  function calc(k){
    let hadir=0,lembur=0,telat=0;DAY_NAMES.forEach(h=>{const a=k?.absensi?.[h]||{};if(a.hadir){hadir+=a.setengahHari?.5:1;lembur+=Number(a.jamLembur)||0;telat+=Number(a.jamTelat)||0}});
    const pokok=hadir*(Number(k.gajiPokok)||0),uangLembur=lembur*20000,potTelat=telat*10000,bonus=Number(k.bonus)||0,kasbon=Number(k.kasbon)||0;
    return {hadir,lembur,telat,pokok,uangLembur,potTelat,bonus,kasbon,total:pokok+uangLembur-potTelat+bonus-kasbon};
  }
  function normalize(items){return Array.isArray(items)?items.map(k=>({nama:String(k?.nama||'Tanpa Nama'),gajiPokok:Number(k?.gajiPokok)||0,absensi:k?.absensi||{},bonus:Number(k?.bonus)||0,kasbon:Number(k?.kasbon)||0})):[]}

  async function fetchWeek(start){
    const res=await fetch(`${ABSENSI_SCRIPT_URL}?action=get&weekStart=${encodeURIComponent(start)}`,{cache:'no-store'});
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const json=await res.json();
    if(!json||json.success!==true)throw new Error(json?.message||'Respons Absensi tidak valid.');
    if(json.weekStart&&json.weekStart!==start)throw new Error('Backend mengembalikan periode yang berbeda.');
    if(!Array.isArray(json.data))throw new Error('Format data Absensi tidak valid.');
    return normalize(json.data);
  }

  function renderPage(page){
    const section=document.getElementById('page-'+page);if(!section)return;
    const start=state.weekStart||weekStart();const end=weekEnd(start);const rows=state.data.map(calc);const total=rows.reduce((a,c)=>a+c.total,0);const hadir=rows.reduce((a,c)=>a+c.hadir,0);const lembur=rows.reduce((a,c)=>a+c.lembur,0);
    const title=page==='attendance'?'Absensi Karyawan':'Payroll Karyawan';
    const desc=page==='attendance'?'Monitoring kehadiran mingguan dari backend People. Data ditampilkan read-only.':'Rekap payroll mingguan berdasarkan data absensi dan formula payroll yang digunakan aplikasi Absensi.';
    section.innerHTML=`<div class="people-shell"><div class="people-head"><div><div class="people-kicker">NUSANTARA BUSINESS · PEOPLE</div><h2>${title}</h2><p>${desc}</p></div><div class="people-actions"><button class="btn secondary" type="button" data-people-reload>↻ Refresh</button></div></div><div class="people-toolbar"><div class="people-field"><label for="peopleWeek">Periode Minggu</label><input id="peopleWeek" type="date" value="${esc(start)}"></div><div class="people-status">${state.loading?'Mengambil data dari backend Absensi…':state.lastSuccess?'Terakhir tersinkron '+new Date(state.lastSuccess).toLocaleString('id-ID'):'Belum tersinkron'}</div></div>${state.lastError?`<div class="people-error">${esc(state.lastError)}</div>`:''}${page==='attendance'?attendanceView():payrollView(total,hadir,lembur)}</div>`;
    section.querySelector('[data-people-reload]')?.addEventListener('click',()=>load(start));
    section.querySelector('#peopleWeek')?.addEventListener('change',e=>{state.weekStart=weekStart(new Date(e.target.value+'T00:00:00'));load(state.weekStart)});
  }
  function attendanceView(){
    const active=state.data.length, present=state.data.reduce((n,k)=>n+calc(k).hadir,0);
    const body=state.data.map(k=>{const c=calc(k);return `<tr><td><strong>${esc(k.nama)}</strong></td><td class="num">${money(k.gajiPokok)}</td><td class="num">${c.hadir} hari</td><td class="num">${c.lembur} jam</td><td class="num">${c.telat} jam</td></tr>`}).join('');
    return `<div class="people-kpis"><div class="people-kpi"><span>Karyawan</span><strong>${active}</strong></div><div class="people-kpi"><span>Total hari hadir</span><strong>${present}</strong></div><div class="people-kpi"><span>Periode</span><strong style="font-size:15px">${esc(state.weekStart||'-')}</strong></div><div class="people-kpi"><span>Status</span><strong style="font-size:15px">Read-only</strong></div></div><div class="people-card"><div class="people-table-wrap"><table class="people-table"><thead><tr><th>Karyawan</th><th>Gaji / Hari</th><th>Hadir</th><th>Lembur</th><th>Telat</th></tr></thead><tbody>${body||'<tr><td colspan="5"><div class="people-empty">Tidak ada data untuk periode ini.</div></td></tr>'}</tbody></table></div></div><div class="people-note">Sumber data: backend Absensi terpisah. Workspace Nusantara Business hanya membaca data; tidak menyediakan tambah, edit, hapus, reset, atau simpan perubahan attendance.</div>`;
  }
  function payrollView(total,hadir,lembur){
    const body=state.data.map(k=>{const c=calc(k);return `<tr><td><strong>${esc(k.nama)}</strong></td><td class="num">${c.hadir}</td><td class="num">${c.pokok?money(c.pokok):money(0)}</td><td class="num">${money(c.uangLembur)}</td><td class="num">-${money(c.potTelat)}</td><td class="num">${money(c.bonus)}</td><td class="num">-${money(c.kasbon)}</td><td class="num total">${money(c.total)}</td></tr>`}).join('');
    return `<div class="people-kpis"><div class="people-kpi"><span>Karyawan</span><strong>${state.data.length}</strong></div><div class="people-kpi"><span>Total hadir</span><strong>${hadir}</strong></div><div class="people-kpi"><span>Total lembur</span><strong>${lembur} jam</strong></div><div class="people-kpi"><span>Grand total gaji</span><strong>${money(total)}</strong></div></div><div class="people-card"><div class="people-table-wrap"><table class="people-table"><thead><tr><th>Karyawan</th><th>Hadir</th><th>Pokok</th><th>Lembur</th><th>Pot. Telat</th><th>Bonus</th><th>Kasbon</th><th>Total Gaji</th></tr></thead><tbody>${body||'<tr><td colspan="8"><div class="people-empty">Tidak ada data untuk periode ini.</div></td></tr>'}</tbody></table></div></div><div class="people-note">Formula mengikuti payroll aplikasi Absensi: gaji pokok = hari hadir × gaji/hari; lembur = jam × Rp20.000; telat = jam × Rp10.000; kemudian ditambah bonus dan dikurangi kasbon. Perhitungan ini read-only di Business Portal.</div>`;
  }

  async function load(start){
    if(state.loading)return;state.loading=true;state.lastError=null;state.weekStart=start||state.weekStart||weekStart();renderPage('attendance');renderPage('payroll');
    try{state.data=await fetchWeek(state.weekStart);state.lastSuccess=Date.now()}catch(e){state.lastError=e?.message||'Gagal mengambil data Absensi.'}finally{state.loading=false;renderPage('attendance');renderPage('payroll')}
  }

  function ensurePage(id,title){
    if(document.getElementById(id))return;
    const main=document.querySelector('.main');if(!main)return;
    const s=document.createElement('section');s.id=id;s.className='page';main.appendChild(s);
  }
  function replacePeopleNav(){
    document.querySelectorAll('[data-business-placeholder="attendance"]').forEach(btn=>{btn.removeAttribute('data-business-placeholder');btn.dataset.page='attendance';btn.dataset.peopleNav='1'});
    document.querySelectorAll('[data-business-placeholder="payroll"]').forEach(btn=>{btn.removeAttribute('data-business-placeholder');btn.dataset.page='payroll';btn.dataset.peopleNav='1'});
    document.querySelectorAll('[data-page="attendance"],[data-page="payroll"]').forEach(btn=>{if(btn.dataset.peopleBound==='1')return;btn.dataset.peopleBound='1';btn.addEventListener('click',()=>{window.showPage?.(btn.dataset.page);window.scrollTo({top:0,left:0,behavior:'auto'});load(state.weekStart||weekStart())})});
  }
  function install(){
    if(state.installed)return;css();ensurePage('page-attendance');ensurePage('page-payroll');replacePeopleNav();state.weekStart=weekStart();state.installed=true;window[KEY]={installed:true,state,getState:()=>({...state,data:state.data.slice()})};renderPage('attendance');renderPage('payroll');
  }
  window[KEY]={installed:false,state,install,getState:()=>({...state,data:state.data.slice()})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
