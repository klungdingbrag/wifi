/* ============================================================
 * NUSANTARA WIFI — ANALYTICS TREND
 * Phase 06: historical billing trend for management review.
 * Read-only: derives insight from already loaded APP data.
 * ============================================================ */
(function(){
  'use strict';
  const SID='analyticsTrendStyle';
  const $=id=>document.getElementById(id);
  const n=v=>typeof num==='function'?num(v):Number(String(v||0).replace(/[^0-9-]/g,''))||0;
  const moneySafe=v=>typeof money==='function'?money(v):'Rp'+Number(v||0).toLocaleString('id-ID');
  const pkey=v=>typeof periodKey==='function'?periodKey(v):String(v||'').slice(0,7);
  const escSafe=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function previous(key){const [y,m]=String(key||'').split('-').map(Number);if(!y||!m)return key;const d=new Date(y,m-2,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
  function lastPeriods(end,count){const out=[];let k=end;for(let i=0;i<count;i++){out.unshift(k);k=previous(k)}return out}
  function styles(){
    if($(SID))return;
    const s=document.createElement('style');s.id=SID;s.textContent=`
      .trend-panel{margin-top:16px;padding:18px;border:1px solid var(--border,#e3eaf1);border-radius:17px;background:var(--surface,#fff)}
      .trend-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}.trend-title{font-size:15px;font-weight:800}.trend-sub{font-size:11px;color:var(--muted,#718096);margin-top:3px}.trend-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;align-items:end;min-height:170px}.trend-col{min-width:0}.trend-month{text-align:center;font-size:9px;color:var(--muted,#718096);margin-top:7px}.trend-track{height:120px;border-bottom:1px solid var(--border,#e3eaf1);display:flex;align-items:flex-end;justify-content:center;gap:5px;padding:0 3px}.trend-bar{width:22px;max-width:42%;min-height:2px;border-radius:6px 6px 2px 2px;background:linear-gradient(180deg,var(--cyan,#17b8dc),var(--primary,#587da5));position:relative}.trend-bar.collection{background:linear-gradient(180deg,var(--success,#58a98a),var(--primary,#587da5))}.trend-bar:hover{opacity:.82}.trend-value{position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);font-size:8px;white-space:nowrap;color:var(--text,#263548);font-weight:800}.trend-legend{display:flex;gap:14px;margin-top:10px;font-size:10px;color:var(--muted,#718096)}.trend-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--primary,#587da5);margin-right:5px}.trend-dot.collection{background:var(--success,#58a98a)}.trend-empty{padding:20px 0;text-align:center;font-size:11px;color:var(--muted,#718096)}
      [data-theme="dark"] .trend-panel{box-shadow:0 8px 24px rgba(0,0,0,.12)}
      @media(max-width:520px){.trend-grid{gap:4px}.trend-track{height:105px}.trend-value{font-size:7px}.trend-bar{width:17px}.trend-legend{flex-wrap:wrap}}
    `;document.head.appendChild(s)
  }
  function ensure(){const anchor=$('managementDecision')||$('analyticsWorkspace');if(!anchor||$('analyticsTrend'))return;const x=document.createElement('section');x.id='analyticsTrend';x.className='trend-panel';x.innerHTML='<div class="trend-head"><div><div class="trend-title">Billing trend · 6 periode</div><div class="trend-sub">Nilai tagihan dibandingkan dengan pendapatan terkumpul. Read-only.</div></div></div><div id="trendGrid"></div><div class="trend-legend"><span><i class="trend-dot"></i>Nilai tagihan</span><span><i class="trend-dot collection"></i>Pendapatan terkumpul</span></div>';anchor.insertAdjacentElement('afterend',x)}
  function render(){styles();ensure();const wrap=$('analyticsTrend');if(!wrap)return;const activeIds=new Set((APP.pelanggan||[]).filter(c=>String(c.Status)==='Aktif').map(c=>String(c['ID Pelanggan'])));const end=$('billPeriod')?.value||(typeof periodNow==='function'?periodNow():'');const periods=lastPeriods(end,6);const data=periods.map(p=>{const bills=(APP.tagihan||[]).filter(b=>activeIds.has(String(b['ID Pelanggan']))&&pkey(b.Period||b.Periode)===p);const billed=bills.reduce((s,b)=>s+n(b.Nominal),0);const outstanding=bills.filter(b=>String(b.Status)!=='Lunas').reduce((s,b)=>s+n(b.Nominal),0);return {p,billed,collected:billed-outstanding}});const max=Math.max(...data.map(x=>x.billed),1);if(!data.some(x=>x.billed)){ $('trendGrid').innerHTML='<div class="trend-empty">Belum ada data billing yang cukup untuk menampilkan trend.</div>';return }$('trendGrid').innerHTML='<div class="trend-grid">'+data.map(x=>{const h=Math.max(2,Math.round(x.billed/max*100));const hc=x.billed?Math.max(2,Math.round(x.collected/max*100)):2;const label=x.p.slice(5);return `<div class="trend-col"><div class="trend-track"><div class="trend-bar" style="height:${h}%"><span class="trend-value">${escSafe(moneySafe(x.billed))}</span></div><div class="trend-bar collection" style="height:${hc}%"><span class="trend-value">${escSafe(moneySafe(x.collected))}</span></div></div><div class="trend-month">${escSafe(label)}</div></div>`}).join('')+'</div>'}
  function init(){render();setTimeout(render,220)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  const old=window.renderAll;if(old)window.renderAll=function(){old();setTimeout(render,0)};
  const oldAnalytics=window.renderAnalyticsWorkspace;if(oldAnalytics)window.renderAnalyticsWorkspace=function(){oldAnalytics();setTimeout(render,0)};
})();
