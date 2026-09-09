/* ============================================================
 * NUSANTARA WIFI — ANALYTICS WORKSPACE
 * Phase 05: operational analytics & management signals.
 * ============================================================ */
(function(){
  'use strict';
  const SID='analyticsWorkspaceStyle';
  const $id=id=>document.getElementById(id);
  const n=v=>typeof num==='function'?num(v):Number(String(v||0).replace(/[^0-9-]/g,''))||0;
  const moneySafe=v=>typeof money==='function'?money(v):'Rp'+Number(v||0).toLocaleString('id-ID');
  const pkey=v=>typeof periodKey==='function'?periodKey(v):String(v||'').slice(0,7);
  const activeCustomers=()=>APP.pelanggan.filter(c=>String(c.Status)==='Aktif');
  const activeIds=()=>new Set(activeCustomers().map(c=>String(c['ID Pelanggan'])));
  const daysIn=(p)=>{const [y,m]=p.split('-').map(Number);return new Date(y,m,0).getDate()};
  function styles(){
    if($id(SID))return;
    const s=document.createElement('style');s.id=SID;s.textContent=`
      .analytics-workspace{display:grid;gap:16px;margin-top:18px}.analytics-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.analytics-card{padding:17px;border:1px solid var(--border,#e3eaf1);border-radius:15px;background:var(--surface,#fff)}.analytics-card-kicker{font-size:10px;font-weight:800;letter-spacing:.07em;color:var(--muted,#718096)}.analytics-card-value{font-size:21px;font-weight:800;margin-top:6px;color:var(--text,#263548)}.analytics-card-note{font-size:11px;color:var(--muted,#718096);margin-top:5px}.analytics-card.warning .analytics-card-value{color:var(--warning,#b98b4f)}.analytics-card.success .analytics-card-value{color:var(--success,#58a98a)}.analytics-panels{display:grid;grid-template-columns:1.15fr .85fr;gap:16px}.analytics-panel{padding:18px;border:1px solid var(--border,#e3eaf1);border-radius:17px;background:var(--surface,#fff)}.analytics-panel-head{display:flex;justify-content:space-between;gap:12px;align-items:start;margin-bottom:14px}.analytics-panel-title{font-weight:800;font-size:15px}.analytics-panel-sub{font-size:11px;color:var(--muted,#718096);margin-top:3px}.analytics-bars{display:grid;gap:10px}.analytics-bar-row{display:grid;grid-template-columns:72px 1fr 88px;gap:9px;align-items:center;font-size:11px}.analytics-bar-track{height:8px;background:var(--bg-soft,#edf2f7);border-radius:99px;overflow:hidden}.analytics-bar-fill{height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,var(--primary,#587da5),var(--cyan,#17b8dc))}.analytics-bar-row strong{text-align:right;font-size:11px}.analytics-list{display:grid;gap:8px}.analytics-list-item{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--border,#e3eaf1);font-size:12px}.analytics-list-item:last-child{border-bottom:0}.analytics-list-item span{color:var(--muted,#718096)}.analytics-empty{font-size:12px;color:var(--muted,#718096);padding:8px 0}@media(max-width:900px){.analytics-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.analytics-panels{grid-template-columns:1fr}}@media(max-width:520px){.analytics-grid{grid-template-columns:1fr}.analytics-bar-row{grid-template-columns:62px 1fr 74px}}
      [data-theme="dark"] .analytics-card,[data-theme="dark"] .analytics-panel{box-shadow:0 8px 24px rgba(0,0,0,.12)}
    `;document.head.appendChild(s)
  }
  function period(){return $id('billPeriod')?.value||periodNow()}
  function ensure(){
    const page=$id('page-dashboard');if(!page||$id('analyticsWorkspace'))return;
    const anchor=$id('dashboardAnalytics')||page.querySelector('.stats-grid');if(!anchor)return;
    const wrap=document.createElement('section');wrap.id='analyticsWorkspace';wrap.className='analytics-workspace';
    wrap.innerHTML='<div class="panel-kicker">MANAGEMENT ANALYTICS</div><div class="analytics-grid" id="analyticsKpis"></div><div class="analytics-panels"><section class="analytics-panel"><div class="analytics-panel-head"><div><div class="analytics-panel-title">Outstanding aging</div><div class="analytics-panel-sub">Tagihan aktif berdasarkan umur keterlambatan.</div></div></div><div id="analyticsAging" class="analytics-bars"></div></section><section class="analytics-panel"><div class="analytics-panel-head"><div><div class="analytics-panel-title">Customer signal</div><div class="analytics-panel-sub">Sinyal pertumbuhan dan kualitas data pelanggan.</div></div></div><div id="analyticsCustomerSignal" class="analytics-list"></div></section></div>';
    anchor.insertAdjacentElement('afterend',wrap)
  }
  function render(){
    styles();ensure();const wrap=$id('analyticsWorkspace');if(!wrap)return;
    const p=period(),ids=activeIds(),customers=activeCustomers();
    const bills=(APP.tagihan||[]).filter(b=>ids.has(String(b['ID Pelanggan']))&&pkey(b.Period||b.Periode)===p);
    const unpaid=bills.filter(b=>String(b.Status)!=='Lunas');
    const validPayments=(APP.pembayaran||[]).filter(x=>pkey(x.Period||x.Periode)===p&&!/dibatalkan/i.test(String(x.Status||'')));
    const billed=bills.reduce((s,b)=>s+n(b.Nominal),0),outstanding=unpaid.reduce((s,b)=>s+n(b.Nominal),0),collected=billed-outstanding;
    const rate=billed?collected/billed*100:0;
    const overdue=unpaid.filter(b=>{const d=String(b['Tanggal Jatuh Tempo']||b['Jatuh Tempo']||b.DueDate||'').slice(0,10);return d&&d<new Date().toISOString().slice(0,10)});
    const kpis=[['Collection rate',rate.toLocaleString('id-ID',{maximumFractionDigits:1})+'%','Nominal '+p],['Outstanding',moneySafe(outstanding),unpaid.length+' tagihan belum bayar'],['Overdue',overdue.length,moneySafe(overdue.reduce((s,b)=>s+n(b.Nominal),0))],['Transaksi valid',validPayments.length,moneySafe(validPayments.reduce((s,x)=>s+n(x.Nominal),0))]];
    $id('analyticsKpis').innerHTML=kpis.map((x,i)=>`<div class="analytics-card ${i===1||i===2?'warning':i===0?'success':''}"><div class="analytics-card-kicker">${esc(x[0])}</div><div class="analytics-card-value">${esc(x[1])}</div><div class="analytics-card-note">${esc(x[2])}</div></div>`).join('');
    const today=new Date().toISOString().slice(0,10), buckets=[['0–7 hari',0],['8–30 hari',0],['31+ hari',0]];
    unpaid.forEach(b=>{const d=String(b['Tanggal Jatuh Tempo']||b['Jatuh Tempo']||b.DueDate||'').slice(0,10);let age=0;if(d){age=Math.max(0,Math.floor((new Date(today)-new Date(d))/86400000))}const idx=age<=7?0:age<=30?1:2;buckets[idx][1]+=n(b.Nominal)});
    const max=Math.max(...buckets.map(x=>x[1]),1);
    $id('analyticsAging').innerHTML=buckets.map(x=>`<div class="analytics-bar-row"><span>${x[0]}</span><div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:${Math.round(x[1]/max*100)}%"></div></div><strong>${moneySafe(x[1])}</strong></div>`).join('');
    const totalCustomers=APP.pelanggan.length,filled=customers.filter(c=>String(c['Paket Speed']||'').trim()).length;
    const recent=customers.filter(c=>String(c['Tanggal Pasang']||'').slice(0,7)===p).length;
    const avgTariff=customers.length?customers.reduce((s,c)=>s+n(c['Tarif Bulanan']),0)/customers.length:0;
    const signals=[['Pelanggan aktif',customers.length],['Data paket terisi',`${filled}/${customers.length||0}`],['Pelanggan baru periode',recent],['Rata-rata tarif',moneySafe(avgTariff)],['Total customer records',totalCustomers]];
    $id('analyticsCustomerSignal').innerHTML=signals.map(x=>`<div class="analytics-list-item"><span>${esc(String(x[0]))}</span><strong>${esc(String(x[1]))}</strong></div>`).join('');
  }
  function init(){render();setTimeout(render,120)}
  window.renderAnalyticsWorkspace=render;
  window.addEventListener('DOMContentLoaded',init);
  const old=window.renderAll; if(old)window.renderAll=function(){old();setTimeout(render,0)};
})();
