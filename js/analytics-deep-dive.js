/* ============================================================
 * NUSANTARA WIFI — ANALYTICS DEEP DIVE
 * Phase 06: collection performance + customer continuity signals.
 * Read-only: derives insight from already loaded APP data.
 * ============================================================ */
(function(){
  'use strict';
  const SID='analyticsDeepDiveStyle';
  const $=id=>document.getElementById(id);
  const n=v=>typeof num==='function'?num(v):Number(String(v||0).replace(/[^0-9-]/g,''))||0;
  const moneySafe=v=>typeof money==='function'?money(v):'Rp'+Number(v||0).toLocaleString('id-ID');
  const pkey=v=>typeof periodKey==='function'?periodKey(v):String(v||'').slice(0,7);
  const escSafe=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function previous(key){const [y,m]=String(key||'').split('-').map(Number);if(!y||!m)return key;const d=new Date(y,m-2,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
  function styles(){
    if($(SID))return;
    const s=document.createElement('style');s.id=SID;s.textContent=`
      .deep-dive-panels{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}.deep-dive-panel{padding:18px;border:1px solid var(--border,#e3eaf1);border-radius:17px;background:var(--surface,#fff)}.deep-dive-head{margin-bottom:14px}.deep-dive-title{font-size:15px;font-weight:800}.deep-dive-sub{font-size:11px;color:var(--muted,#718096);margin-top:3px}.deep-dive-list{display:grid;gap:8px}.deep-dive-row{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--border,#e3eaf1);font-size:12px}.deep-dive-row:last-child{border-bottom:0}.deep-dive-row span{color:var(--muted,#718096)}.deep-dive-row strong{text-align:right}.deep-dive-note{font-size:10px;color:var(--muted,#718096);margin-top:10px}.deep-dive-good{color:var(--success,#58a98a)}.deep-dive-warn{color:var(--warning,#b98b4f)}.deep-dive-bad{color:var(--danger,#ad737d)}
      [data-theme="dark"] .deep-dive-panel{box-shadow:0 8px 24px rgba(0,0,0,.12)}
      @media(max-width:900px){.deep-dive-panels{grid-template-columns:1fr}}`;
    document.head.appendChild(s)
  }
  function ensure(){
    const anchor=$('analyticsTrend')||$('analyticsWorkspace');
    if(!anchor||$('analyticsDeepDive'))return;
    const x=document.createElement('section');x.id='analyticsDeepDive';x.className='deep-dive-panels';
    x.innerHTML='<section class="deep-dive-panel"><div class="deep-dive-head"><div class="deep-dive-title">Collection performance</div><div class="deep-dive-sub">Pembayaran valid menurut metode pada periode terpilih.</div></div><div id="deepDiveCollection" class="deep-dive-list"></div><div id="deepDiveCollectionNote" class="deep-dive-note"></div></section><section class="deep-dive-panel"><div class="deep-dive-head"><div class="deep-dive-title">Customer continuity</div><div class="deep-dive-sub">Sinyal pelanggan baru dan kesinambungan billing antarperiode.</div></div><div id="deepDiveCustomer" class="deep-dive-list"></div><div id="deepDiveCustomerNote" class="deep-dive-note"></div></section>';
    anchor.insertAdjacentElement('afterend',x)
  }
  function render(){
    styles();ensure();const wrap=$('analyticsDeepDive');if(!wrap)return;
    const p=$('billPeriod')?.value||(typeof periodNow==='function'?periodNow():'');const prev=previous(p);
    const active=(APP.pelanggan||[]).filter(c=>String(c.Status)==='Aktif');const ids=new Set(active.map(c=>String(c['ID Pelanggan'])));
    const bills=(APP.tagihan||[]).filter(b=>ids.has(String(b['ID Pelanggan']))&&pkey(b.Period||b.Periode)===p);
    const prevBills=(APP.tagihan||[]).filter(b=>ids.has(String(b['ID Pelanggan']))&&pkey(b.Period||b.Periode)===prev);
    const valid=(APP.pembayaran||[]).filter(x=>pkey(x.Period||x.Periode)===p&&!/dibatalkan/i.test(String(x.Status||'')));
    const billed=bills.reduce((s,b)=>s+n(b.Nominal),0),outstanding=bills.filter(b=>String(b.Status)!=='Lunas').reduce((s,b)=>s+n(b.Nominal),0),collected=billed-outstanding;
    const methods=new Map();valid.forEach(x=>{const method=String(x.Metode||x.Method||x['Metode Pembayaran']||'Lainnya').trim()||'Lainnya';methods.set(method,(methods.get(method)||0)+n(x.Nominal))});
    const methodRows=[...methods.entries()].sort((a,b)=>b[1]-a[1]);
    const avg=valid.length?valid.reduce((s,x)=>s+n(x.Nominal),0)/valid.length:0;
    if(!methodRows.length){$('deepDiveCollection').innerHTML='<div class="deep-dive-note">Belum ada pembayaran valid pada periode ini.</div>'}
    else $('deepDiveCollection').innerHTML=methodRows.map(([m,v])=>`<div class="deep-dive-row"><span>${escSafe(m)}</span><strong>${escSafe(moneySafe(v))}</strong></div>`).join('');
    const rate=billed?collected/billed*100:0;
    $('deepDiveCollectionNote').textContent=`${valid.length} transaksi valid · rata-rata ${moneySafe(avg)} · collection rate ${rate.toLocaleString('id-ID',{maximumFractionDigits:1})}%`;
    const currentIds=new Set(bills.map(b=>String(b['ID Pelanggan']))),previousIds=new Set(prevBills.map(b=>String(b['ID Pelanggan'])));
    const newCustomers=active.filter(c=>String(c['Tanggal Pasang']||'').slice(0,7)===p).length;
    const returning=[...currentIds].filter(id=>previousIds.has(id)).length;
    const priorBilledCustomers=previousIds.size;
    const continuity=priorBilledCustomers?returning/priorBilledCustomers*100:0;
    const currentOnly=[...currentIds].filter(id=>!previousIds.has(id)).length;
    const lost=[...previousIds].filter(id=>!currentIds.has(id)).length;
    const rows=[['Pelanggan baru periode',newCustomers],['Pelanggan billing periode',currentIds.size],['Billing berlanjut dari periode lalu',returning],['Pelanggan baru dalam billing',currentOnly],['Tidak muncul kembali',lost]];
    $('deepDiveCustomer').innerHTML=rows.map(x=>`<div class="deep-dive-row"><span>${escSafe(x[0])}</span><strong>${escSafe(String(x[1]))}</strong></div>`).join('');
    const cls=continuity>=90?'deep-dive-good':continuity>=70?'deep-dive-warn':'deep-dive-bad';
    $('deepDiveCustomerNote').innerHTML=`Continuity billing: <strong class="${cls}">${continuity.toLocaleString('id-ID',{maximumFractionDigits:1})}%</strong> dari pelanggan yang memiliki billing pada ${escSafe(prev)} juga memiliki billing pada ${escSafe(p)}. Ini adalah signal operasional, bukan churn final.`;
  }
  function init(){render();setTimeout(render,240)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  const old=window.renderAll;if(old)window.renderAll=function(){old();setTimeout(render,0)};
  const oldTrend=window.renderAnalyticsTrend;if(oldTrend)window.renderAnalyticsTrend=function(){oldTrend();setTimeout(render,0)};
  window.renderAnalyticsDeepDive=render;
})();
