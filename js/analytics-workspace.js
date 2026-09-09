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
  function previousPeriod(key){
    const [y,m]=String(key||'').split('-').map(Number);
    if(!y||!m)return key;
    const d=new Date(y,m-2,1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  }
  function styles(){
    if($id(SID))return;
    const s=document.createElement('style');s.id=SID;s.textContent=`
      .analytics-workspace{display:grid;gap:16px;margin-top:18px}.analytics-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.analytics-card{padding:17px;border:1px solid var(--border,#e3eaf1);border-radius:15px;background:var(--surface,#fff)}.analytics-card-kicker{font-size:10px;font-weight:800;letter-spacing:.07em;color:var(--muted,#718096)}.analytics-card-value{font-size:21px;font-weight:800;margin-top:6px;color:var(--text,#263548)}.analytics-card-note{font-size:11px;color:var(--muted,#718096);margin-top:5px}.analytics-card.warning .analytics-card-value{color:var(--warning,#b98b4f)}.analytics-card.success .analytics-card-value{color:var(--success,#58a98a)}.analytics-panels{display:grid;grid-template-columns:1.15fr .85fr;gap:16px}.analytics-panel{padding:18px;border:1px solid var(--border,#e3eaf1);border-radius:17px;background:var(--surface,#fff)}.analytics-panel-head{display:flex;justify-content:space-between;gap:12px;align-items:start;margin-bottom:14px}.analytics-panel-title{font-weight:800;font-size:15px}.analytics-panel-sub{font-size:11px;color:var(--muted,#718096);margin-top:3px}.analytics-bars{display:grid;gap:10px}.analytics-bar-row{display:grid;grid-template-columns:72px 1fr 88px;gap:9px;align-items:center;font-size:11px}.analytics-bar-track{height:8px;background:var(--bg-soft,#edf2f7);border-radius:99px;overflow:hidden}.analytics-bar-fill{height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,var(--primary,#587da5),var(--cyan,#17b8dc))}.analytics-bar-row strong{text-align:right;font-size:11px}.analytics-list{display:grid;gap:8px}.analytics-list-item{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--border,#e3eaf1);font-size:12px}.analytics-list-item:last-child{border-bottom:0}.analytics-list-item span{color:var(--muted,#718096)}.analytics-delta{font-size:10px;font-weight:800;margin-left:6px}.analytics-delta.up{color:var(--success,#58a98a)}.analytics-delta.down{color:var(--danger,#a87178)}.analytics-delta.flat{color:var(--muted,#718096)}.analytics-followup{display:grid;gap:8px}.analytics-followup-item{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:11px 12px;border:1px solid var(--border,#e3eaf1);border-radius:12px;background:var(--surface-2,#f8fafc)}.analytics-followup-main{min-width:0}.analytics-followup-name{font-weight:800;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.analytics-followup-meta{font-size:10px;color:var(--muted,#718096);margin-top:3px}.analytics-followup-right{text-align:right}.analytics-followup-amount{font-weight:800;font-size:12px}.analytics-priority{display:inline-flex;margin-top:4px;padding:3px 7px;border-radius:999px;font-size:9px;font-weight:800}.analytics-priority.critical{background:var(--danger-soft,#faf0f1);color:var(--danger,#a87178)}.analytics-priority.follow{background:var(--warning-soft,#faf4e9);color:var(--warning,#b58c5a)}.analytics-priority.monitor{background:var(--primary-soft,#edf3f9);color:var(--primary,#587da5)}.analytics-wa{display:inline-flex;margin-top:5px;font-size:10px;color:var(--primary,#587da5);text-decoration:none;font-weight:800}.analytics-empty{font-size:11px;color:var(--muted,#718096);padding:8px 0}.analytics-legend{font-size:10px;color:var(--muted,#718096);margin-top:10px}@media(max-width:900px){.analytics-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.analytics-panels{grid-template-columns:1fr}}@media(max-width:520px){.analytics-grid{grid-template-columns:1fr}.analytics-bar-row{grid-template-columns:62px 1fr 74px}.analytics-followup-item{grid-template-columns:1fr}.analytics-followup-right{text-align:left}}
      [data-theme="dark"] .analytics-card,[data-theme="dark"] .analytics-panel{box-shadow:0 8px 24px rgba(0,0,0,.12)}
    `;document.head.appendChild(s)
  }
  function period(){return $id('billPeriod')?.value||periodNow()}
  function ensure(){
    const page=$id('page-dashboard');if(!page||$id('analyticsWorkspace'))return;
    const anchor=$id('dashboardAnalytics')||page.querySelector('.stats-grid');if(!anchor)return;
    const wrap=document.createElement('section');wrap.id='analyticsWorkspace';wrap.className='analytics-workspace';
    wrap.innerHTML='<div class="panel-kicker">MANAGEMENT ANALYTICS</div><div class="analytics-grid" id="analyticsKpis"></div><div class="analytics-panels"><section class="analytics-panel"><div class="analytics-panel-head"><div><div class="analytics-panel-title">Revenue & collection</div><div class="analytics-panel-sub">Perbandingan periode terpilih dengan bulan sebelumnya.</div></div></div><div id="analyticsRevenue" class="analytics-list"></div></section><section class="analytics-panel"><div class="analytics-panel-head"><div><div class="analytics-panel-title">Outstanding aging</div><div class="analytics-panel-sub">Tagihan aktif berdasarkan umur keterlambatan.</div></div></div><div id="analyticsAging" class="analytics-bars"></div></section></div><div class="analytics-panels"><section class="analytics-panel"><div class="analytics-panel-head"><div><div class="analytics-panel-title">Customer signal</div><div class="analytics-panel-sub">Sinyal pertumbuhan dan kualitas data pelanggan.</div></div></div><div id="analyticsCustomerSignal" class="analytics-list"></div></section><section class="analytics-panel"><div class="analytics-panel-head"><div><div class="analytics-panel-title">Follow-up priority</div><div class="analytics-panel-sub">Pelanggan aktif yang memiliki tagihan belum lunas.</div></div></div><div id="analyticsFollowup" class="analytics-followup"></div></section></div>';
    anchor.insertAdjacentElement('afterend',wrap)
  }
  function syncRoadmap(){
    const page=$id('page-roadmap');if(!page)return;
    const cards=page.querySelectorAll('.roadmap-card');if(cards.length>=6){cards[3].classList.remove('next');cards[3].classList.add('done');cards[3].querySelector('.roadmap-status').textContent='SELESAI';cards[4].classList.remove('planned');cards[4].classList.add('next');cards[4].querySelector('.roadmap-status').textContent='BERIKUTNYA'}
    const value=page.querySelector('.roadmap-progress-value'),bar=page.querySelector('.roadmap-progress-bar span'),small=page.querySelector('.roadmap-progress small');if(value)value.textContent='66.7%';if(bar)bar.style.width='66.7%';if(small)small.textContent='4 dari 6 fase utama selesai.';
    const now=page.querySelector('.roadmap-now strong'),desc=page.querySelector('.roadmap-now span');if(now)now.textContent='Next focus · Analytics & Management';if(desc)desc.textContent='Transaction Center sudah menjadi pusat transaksi. Fokus berikutnya adalah mengubah data billing menjadi insight operasional untuk membantu keputusan harian.';
  }
  function render(){
    styles();ensure();syncRoadmap();const wrap=$id('analyticsWorkspace');if(!wrap)return;
    const p=period(),prev=previousPeriod(p),ids=activeIds(),customers=activeCustomers();
    const allBills=APP.tagihan||[];
    const bills=allBills.filter(b=>ids.has(String(b['ID Pelanggan']))&&pkey(b.Period||b.Periode)===p);
    const prevBills=allBills.filter(b=>ids.has(String(b['ID Pelanggan']))&&pkey(b.Period||b.Periode)===prev);
    const unpaid=bills.filter(b=>String(b.Status)!=='Lunas');
    const validPayments=(APP.pembayaran||[]).filter(x=>pkey(x.Period||x.Periode)===p&&!/dibatalkan/i.test(String(x.Status||'')));
    const billed=bills.reduce((s,b)=>s+n(b.Nominal),0),outstanding=unpaid.reduce((s,b)=>s+n(b.Nominal),0),collected=billed-outstanding;
    const prevBilled=prevBills.reduce((s,b)=>s+n(b.Nominal),0),prevOutstanding=prevBills.filter(b=>String(b.Status)!=='Lunas').reduce((s,b)=>s+n(b.Nominal),0),prevCollected=prevBilled-prevOutstanding;
    const rate=billed?collected/billed*100:0,prevRate=prevBilled?prevCollected/prevBilled*100:0,today=new Date().toISOString().slice(0,10);
    const overdue=unpaid.filter(b=>{const d=String(b['Tanggal Jatuh Tempo']||b['Jatuh Tempo']||b.DueDate||'').slice(0,10);return d&&d<today});
    const kpis=[['Collection rate',rate.toLocaleString('id-ID',{maximumFractionDigits:1})+'%','Nominal '+p],['Outstanding',moneySafe(outstanding),unpaid.length+' tagihan belum bayar'],['Overdue',overdue.length,moneySafe(overdue.reduce((s,b)=>s+n(b.Nominal),0))],['Transaksi valid',validPayments.length,moneySafe(validPayments.reduce((s,x)=>s+n(x.Nominal),0))]];
    $id('analyticsKpis').innerHTML=kpis.map((x,i)=>`<div class="analytics-card ${i===1||i===2?'warning':i===0?'success':''}"><div class="analytics-card-kicker">${esc(x[0])}</div><div class="analytics-card-value">${esc(x[1])}</div><div class="analytics-card-note">${esc(x[2])}</div></div>`).join('');
    function delta(cur,old,reverse=false){const d=cur-old,abs=old?Math.abs(d/old*100):cur?100:0;const cls=d===0?'flat':((d>0)!==reverse?'up':'down');const sign=d>0?'+':d<0?'−':'±';return `<span class="analytics-delta ${cls}">${sign}${abs.toLocaleString('id-ID',{maximumFractionDigits:1})}%</span>`}
    const revenueRows=[['Pendapatan terkumpul',moneySafe(collected),delta(collected,prevCollected)],['Collection rate',rate.toLocaleString('id-ID',{maximumFractionDigits:1})+'%',delta(rate,prevRate)],['Outstanding',moneySafe(outstanding),delta(outstanding,prevOutstanding,true)],['Nilai tagihan',moneySafe(billed),delta(billed,prevBilled)]];
    $id('analyticsRevenue').innerHTML=revenueRows.map(x=>`<div class="analytics-list-item"><span>${esc(x[0])}</span><strong>${esc(x[1])}${x[2]}</strong></div>`).join('');
    const buckets=[['0–7 hari',0],['8–30 hari',0],['31+ hari',0]];
    unpaid.forEach(b=>{const d=String(b['Tanggal Jatuh Tempo']||b['Jatuh Tempo']||b.DueDate||'').slice(0,10);let age=0;if(d)age=Math.max(0,Math.floor((new Date(today)-new Date(d))/86400000));const idx=age<=7?0:age<=30?1:2;buckets[idx][1]+=n(b.Nominal)});
    const max=Math.max(...buckets.map(x=>x[1]),1);
    $id('analyticsAging').innerHTML=buckets.map(x=>`<div class="analytics-bar-row"><span>${x[0]}</span><div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:${Math.round(x[1]/max*100)}%"></div></div><strong>${moneySafe(x[1])}</strong></div>`).join('');
    const totalCustomers=APP.pelanggan.length,filled=customers.filter(c=>String(c['Paket Speed']||'').trim()).length,recent=customers.filter(c=>String(c['Tanggal Pasang']||'').slice(0,7)===p).length,avgTariff=customers.length?customers.reduce((s,c)=>s+n(c['Tarif Bulanan']),0)/customers.length:0;
    const signals=[['Pelanggan aktif',customers.length],['Data paket terisi',`${filled}/${customers.length||0}`],['Pelanggan baru periode',recent],['Rata-rata tarif',moneySafe(avgTariff)],['Total customer records',totalCustomers]];
    $id('analyticsCustomerSignal').innerHTML=signals.map(x=>`<div class="analytics-list-item"><span>${esc(String(x[0]))}</span><strong>${esc(String(x[1]))}</strong></div>`).join('');
    const customerById=new Map(customers.map(c=>[String(c['ID Pelanggan']),c]));
    const followups=unpaid.map(b=>{const c=customerById.get(String(b['ID Pelanggan']))||{};const due=String(b['Tanggal Jatuh Tempo']||b['Jatuh Tempo']||b.DueDate||'').slice(0,10);const age=due?Math.max(0,Math.floor((new Date(today)-new Date(due))/86400000)):0;const priority=age>30?'critical':age>7?'follow':'monitor';return {b,c,due,age,priority}}).sort((a,b)=>n(b.b.Nominal)-n(a.b.Nominal));
    const top=followups.slice(0,6);
    if(!top.length){$id('analyticsFollowup').innerHTML='<div class="analytics-empty">Tidak ada tagihan yang perlu ditindaklanjuti pada periode ini.</div>'}
    else $id('analyticsFollowup').innerHTML=top.map(x=>{const phone=String(x.c['No. WhatsApp']||x.c.WhatsApp||'').replace(/\D/g,'');const wa=phone?`https://wa.me/${phone}`:'';const name=String(x.c.Nama||x.c['Nama Pelanggan']||x.b['Nama Pelanggan']||x.b['ID Pelanggan']||'Pelanggan');const label=x.priority==='critical'?'CRITICAL':x.priority==='follow'?'FOLLOW-UP':'MONITOR';const ageText=x.age>0?`${x.age} hari lewat jatuh tempo`:x.due?'Belum lewat jatuh tempo':'Jatuh tempo belum tersedia';return `<div class="analytics-followup-item"><div class="analytics-followup-main"><div class="analytics-followup-name">${esc(name)}</div><div class="analytics-followup-meta">${esc(String(x.b.Period||x.b.Periode||p))} · ${esc(ageText)}</div></div><div class="analytics-followup-right"><div class="analytics-followup-amount">${moneySafe(x.b.Nominal)}</div><span class="analytics-priority ${x.priority}">${label}</span>${wa?`<br><a class="analytics-wa" href="${wa}" target="_blank" rel="noopener">WhatsApp ↗</a>`:''}</div></div>`}).join('');
  }
  function init(){render();setTimeout(render,120)}
  window.renderAnalyticsWorkspace=render;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  const old=window.renderAll;if(old)window.renderAll=function(){old();setTimeout(render,0)};
})();
