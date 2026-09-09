/* ============================================================
 * NUSANTARA BUSINESS — ABSENSI WORKSPACE
 * Phase 04: native read-only integration with the existing
 * TB Nusantara Absensi Apps Script backend.
 *
 * IMPORTANT:
 * - This module is READ-ONLY.
 * - It does not modify the Absensi backend.
 * - It does not replace the legacy Absensi application.
 * - The existing Apps Script endpoint remains the source of truth.
 * ============================================================ */
(function(){
  'use strict';

  const SCRIPT_URL='https://script.google.com/macros/s/AKfycbwjpeYThkyGewyR8PAY8SxkGPM32-zWkAVniJfzPcLk2yrztpjQPPCECJF3ApKck41_kg/exec';
  const PAGE_ID='page-absensi';
  const STYLE_ID='absensiWorkspaceStyle';
  const HARI=['minggu','senin','selasa','rabu','kamis','jumat','sabtu'];
  const DAY_LABEL=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const state={weekStart:null,weekEnd:null,data:[],loading:false,error:null,lastSuccess:null};

  function $(id){return document.getElementById(id)}
  function esc(value){return String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function rupiah(value){return 'Rp '+Number(value||0).toLocaleString('id-ID')}
  function dateKey(date){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`}
  function startOfWeek(date){const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());d.setDate(d.getDate()-d.getDay());return d}
  function addDays(date,n){const d=new Date(date);d.setDate(d.getDate()+n);return d}
  function formatDate(key){if(!key)return '-';return new Date(key+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}
  function currentWeekStart(){return dateKey(startOfWeek(new Date()))}

  function installStyles(){
    if($(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;
    s.textContent=`
      .absensi-workspace{display:grid;gap:16px}
      .absensi-hero,.absensi-toolbar,.absensi-summary,.absensi-table-card,.absensi-status{background:var(--surface,#fff);border:1px solid var(--border,#e3eaf1);border-radius:18px;box-shadow:0 8px 24px rgba(20,45,70,.05)}
      .absensi-hero{padding:22px;display:flex;justify-content:space-between;gap:18px;align-items:flex-start}
      .absensi-kicker{font-size:10px;font-weight:800;letter-spacing:.09em;color:var(--muted,#718096)}
      .absensi-hero h2{margin:5px 0 7px;font-size:25px;color:var(--text,#263548);letter-spacing:-.02em}
      .absensi-hero p{margin:0;max-width:760px;color:var(--muted,#718096);line-height:1.6;font-size:13px}
      .absensi-legacy{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid var(--border,#e3eaf1);border-radius:10px;color:var(--primary,#587da5);text-decoration:none;font-size:12px;font-weight:700;white-space:nowrap;background:var(--surface,#fff)}
      .absensi-toolbar{padding:14px;display:grid;grid-template-columns:auto 1fr auto auto;gap:10px;align-items:center}
      .absensi-toolbar button,.absensi-toolbar a{font:inherit}
      .absensi-week-label{font-size:12px;color:var(--muted,#718096);line-height:1.45}.absensi-week-label strong{display:block;color:var(--text,#263548);font-size:13px}
      .absensi-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;overflow:hidden}.absensi-kpi{padding:17px;background:var(--surface,#fff)}.absensi-kpi span{display:block;font-size:10px;font-weight:800;letter-spacing:.07em;color:var(--muted,#718096)}.absensi-kpi strong{display:block;margin-top:5px;font-size:21px;color:var(--text,#263548)}
      .absensi-table-card{overflow:hidden}.absensi-table-head{padding:16px 18px;border-bottom:1px solid var(--border,#e3eaf1);display:flex;justify-content:space-between;gap:12px;align-items:center}.absensi-table-head h3{margin:0;font-size:16px;color:var(--text,#263548)}.absensi-table-head span{font-size:11px;color:var(--muted,#718096)}
      .absensi-table-wrap{overflow:auto}.absensi-table{width:100%;min-width:900px;border-collapse:collapse}.absensi-table th,.absensi-table td{padding:10px 9px;border-bottom:1px solid var(--border,#e3eaf1);text-align:center;font-size:11px;color:var(--text,#263548)}.absensi-table th{font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted,#718096);background:var(--bg-soft,#f4f7fa);position:sticky;top:0;z-index:1}.absensi-table th:first-child,.absensi-table td:first-child{text-align:left;position:sticky;left:0;background:var(--surface,#fff);z-index:2}.absensi-table th:first-child{background:var(--bg-soft,#f4f7fa);z-index:3}.absensi-att{font-weight:800}.absensi-att.present{color:var(--success,#58a98a)}.absensi-att.absent{color:var(--danger,#ad737d)}.absensi-att.half{color:var(--warning,#b98b4f)}.absensi-total{font-weight:800}.absensi-status{padding:12px 15px;font-size:12px;color:var(--muted,#718096)}.absensi-status.error{color:var(--danger,#ad737d);border-color:rgba(173,115,125,.3)}
      [data-theme="dark"] .absensi-hero,[data-theme="dark"] .absensi-toolbar,[data-theme="dark"] .absensi-summary,[data-theme="dark"] .absensi-table-card,[data-theme="dark"] .absensi-status{box-shadow:0 10px 30px rgba(0,0,0,.18)}
      @media(max-width:900px){.absensi-hero{flex-direction:column}.absensi-toolbar{grid-template-columns:1fr 1fr}.absensi-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:520px){.absensi-toolbar{grid-template-columns:1fr}.absensi-summary{grid-template-columns:1fr 1fr}.absensi-hero h2{font-size:21px}}
    `;
    document.head.appendChild(s)
  }

  function ensurePage(){
    let page=$(PAGE_ID);if(page)return page;
    const main=document.querySelector('.main');if(!main)return null;
    page=document.createElement('section');page.id=PAGE_ID;page.className='page';main.appendChild(page);return page
  }

  function weekEnd(start){return dateKey(addDays(new Date(start+'T00:00:00'),6))}
  function moveWeek(delta){const base=new Date((state.weekStart||currentWeekStart())+'T00:00:00');base.setDate(base.getDate()+delta*7);loadWeek(dateKey(base))}

  async function loadWeek(start){
    if(state.loading)return;
    state.loading=true;state.error=null;state.weekStart=start;state.weekEnd=weekEnd(start);renderLoading();
    try{
      const url=`${SCRIPT_URL}?action=get&weekStart=${encodeURIComponent(start)}`;
      const response=await fetch(url,{cache:'no-store'});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const result=await response.json();
      if(!result||result.success!==true)throw new Error(result?.message||'Respons Absensi tidak valid.');
      if(result.weekStart&&result.weekStart!==start)throw new Error('Backend mengembalikan periode yang berbeda.');
      if(!Array.isArray(result.data))throw new Error('Format data Absensi tidak valid.');
      state.data=result.data.map(normalizeEmployee);state.lastSuccess=Date.now();render();
    }catch(error){
      console.error('[Absensi Workspace]',error);state.error=error?.message||'Gagal memuat Absensi.';state.data=[];render();
    }finally{state.loading=false}
  }

  function normalizeEmployee(raw){
    const abs={};HARI.forEach(h=>{const a=raw?.absensi?.[h]||{};abs[h]={hadir:!!a.hadir,setengahHari:!!a.setengahHari,jamLembur:Number(a.jamLembur)||0,jamTelat:Number(a.jamTelat)||0}});
    return {id:String(raw?.id||''),nama:String(raw?.nama||'-'),gajiPokok:Number(raw?.gajiPokok)||0,bonus:Number(raw?.bonus)||0,kasbon:Number(raw?.kasbon)||0,absensi:abs}
  }

  function calculate(k){
    let hadir=0,lembur=0,telat=0;HARI.forEach(h=>{const a=k.absensi[h];if(a.hadir){hadir+=a.setengahHari?.5:1;lembur+=a.jamLembur;telat+=a.jamTelat}});
    const pokok=hadir*k.gajiPokok,uangLembur=lembur*20000,potTelat=telat*10000,total=pokok+uangLembur-potTelat+k.bonus-k.kasbon;
    return {hadir,lembur,telat,pokok,uangLembur,potTelat,total}
  }

  function renderLoading(){const page=ensurePage();if(!page)return;page.innerHTML='<div class="absensi-workspace"><div class="absensi-status">Memuat data Absensi dari backend Apps Script...</div></div>'}

  function render(){
    const page=ensurePage();if(!page)return;installStyles();
    const totals=state.data.reduce((acc,k)=>{const c=calculate(k);acc.gaji+=c.total;acc.hadir+=c.hadir;acc.lembur+=c.lembur;acc.telat+=c.telat;return acc},{gaji:0,hadir:0,lembur:0,telat:0});
    const status=state.error?`<div class="absensi-status error">${esc(state.error)} <button class="btn secondary mini" type="button" id="absensiRetry">Coba lagi</button></div>`:'';
    const rows=state.data.map(k=>{const c=calculate(k);const days=HARI.map((h,i)=>{const a=k.absensi[h];let label='—',cls='absent';if(a.hadir){label=a.setengahHari?'½':'✓';cls=a.setengahHari?'half':'present'}return `<td><span class="absensi-att ${cls}" title="${DAY_LABEL[i]}">${label}</span></td>`}).join('');return `<tr><td><strong>${esc(k.nama)}</strong><br><small>${rupiah(k.gajiPokok)}/hari</small></td>${days}<td class="absensi-total">${c.hadir}</td><td>${c.lembur}j</td><td>${c.telat}j</td><td>${rupiah(c.total)}</td></tr>`}).join('');
    page.innerHTML=`<div class="absensi-workspace"><div class="absensi-hero"><div><div class="absensi-kicker">NUSANTARA BUSINESS · PEOPLE</div><h2>Absensi & Payroll</h2><p>Workspace native Nusantara Business untuk membaca data Absensi. Data tetap bersumber dari backend Apps Script Absensi yang terpisah; tahap ini belum mengaktifkan penulisan data.</p></div><a class="absensi-legacy" href="https://github.com/klungdingbrag/absensi" target="_blank" rel="noopener">↗ Absensi Legacy</a></div><div class="absensi-toolbar"><button class="btn secondary" type="button" id="absensiPrev">← Minggu Sebelumnya</button><div class="absensi-week-label"><strong>Periode aktif</strong>${formatDate(state.weekStart)} — ${formatDate(state.weekEnd)}</div><button class="btn secondary" type="button" id="absensiNext">Minggu Berikutnya →</button><button class="btn primary" type="button" id="absensiRefresh">↻ Refresh</button></div>${status}<div class="absensi-summary"><div class="absensi-kpi"><span>Karyawan</span><strong>${state.data.length}</strong></div><div class="absensi-kpi"><span>Total Hadir</span><strong>${totals.hadir}</strong></div><div class="absensi-kpi"><span>Total Lembur</span><strong>${totals.lembur} jam</strong></div><div class="absensi-kpi"><span>Estimasi Gaji</span><strong>${rupiah(totals.gaji)}</strong></div></div><div class="absensi-table-card"><div class="absensi-table-head"><h3>Rekap Absensi & Gaji</h3><span>Read-only · source: Apps Script Absensi</span></div><div class="absensi-table-wrap"><table class="absensi-table"><thead><tr><th>Karyawan</th>${DAY_LABEL.map((d,i)=>`<th>${d}<br><small>${formatDate(dateKey(addDays(new Date(state.weekStart+'T00:00:00'),i)))}</small></th>`).join('')}<th>Hadir</th><th>Lembur</th><th>Telat</th><th>Total Gaji</th></tr></thead><tbody>${rows||'<tr><td colspan="12">Tidak ada data untuk periode ini.</td></tr>'}</tbody></table></div></div></div>`;
    $('absensiPrev')?.addEventListener('click',()=>moveWeek(-1));$('absensiNext')?.addEventListener('click',()=>moveWeek(1));$('absensiRefresh')?.addEventListener('click',()=>loadWeek(state.weekStart||currentWeekStart()));$('absensiRetry')?.addEventListener('click',()=>loadWeek(state.weekStart||currentWeekStart()));
  }

  function init(){
    const page=ensurePage();if(!page){setTimeout(init,100);return}installStyles();
    const start=currentWeekStart();state.weekStart=start;state.weekEnd=weekEnd(start);renderLoading();
    if(!window.__nusantaraAbsensiWorkspace){window.__nusantaraAbsensiWorkspace={loadWeek,getState:()=>({...state,data:state.data.slice()})}}
    loadWeek(start)
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
