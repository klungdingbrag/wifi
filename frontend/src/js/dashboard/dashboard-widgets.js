/* NUSANTARA WIFI — DASHBOARD WIDGETS V4 */
'use strict';
(function(){
  const SID='dashboard-v4-style';
  const ICONS=[
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 19c.5-3.2 2.2-5 5.5-5s5 1.8 5.5 5M17 11.5a2.7 2.7 0 1 0 0-5.4M16 14.2c2.7.1 4.2 1.7 4.6 4.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 8h8M8 12h8M8 16h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 21 20H3L12 4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 9v5M12 17.2v.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.2 4.2L19 6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  ];

  function style(){
    if(document.getElementById(SID))return;
    const s=document.createElement('style');
    s.id=SID;
    s.textContent=`
      .dashboard-stat-icon{width:29px;height:29px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;position:absolute;right:15px;top:15px;z-index:2}
      .dashboard-stat-icon svg{width:15px;height:15px}
      .dashboard-stat-icon.blue{background:var(--primary-soft);color:var(--primary)}
      .dashboard-stat-icon.slate{background:var(--surface-soft);color:var(--muted)}
      .dashboard-stat-icon.orange{background:var(--warning-soft);color:var(--warning)}
      .dashboard-stat-icon.green{background:var(--success-soft);color:var(--success)}
    `;
    document.head.appendChild(s);
  }

  function val(x){return typeof money==='function'?money(x):'Rp'+Number(x||0).toLocaleString('id-ID')}
  function period(){return $('billPeriod')?.value||periodNow()}

  function analytics(){
    style();
    const page=$('page-dashboard'),stats=page?.querySelector('.stats-grid');
    if(!stats)return;

    let a=$('dashboardAnalytics');
    if(!a){
      a=document.createElement('div');
      a.id='dashboardAnalytics';
      a.className='dashboard-analytics';
      stats.parentNode.insertBefore(a,stats);
      a.innerHTML='<section id="dashboardTrend" class="dashboard-trend"></section><section id="dashboardFocus" class="dashboard-focus"></section>';
    }

    const p=period();
    const activeIds=new Set((APP.pelanggan||[]).filter(c=>String(c.Status)==='Aktif').map(c=>String(c['ID Pelanggan'])));
    const b=(APP.tagihan||[]).filter(x=>activeIds.has(String(x['ID Pelanggan']))&&periodKey(x.Period||x.Periode)===p);
    const u=b.filter(x=>x.Status!=='Lunas');
    const paid=b.filter(x=>x.Status==='Lunas');
    const billed=b.reduce((s,x)=>s+num(x.Nominal),0);
    const collected=paid.reduce((s,x)=>s+num(x.Nominal),0);
    const rate=billed?Math.round(collected/billed*1000)/10:0;

    $('dashboardFocus').innerHTML=`
      <div class="dashboard-focus-kicker">BILLING PULSE</div>
      <div class="dashboard-focus-title">Ringkasan ${esc(p)}</div>
      <div class="dashboard-focus-grid">
        <div class="dashboard-focus-item"><span class="dashboard-focus-label">Total tagihan</span><strong class="dashboard-focus-value">${b.length}</strong></div>
        <div class="dashboard-focus-item warning"><span class="dashboard-focus-label">Belum bayar</span><strong class="dashboard-focus-value">${val(u.reduce((s,x)=>s+num(x.Nominal),0))}</strong></div>
        <div class="dashboard-focus-item success"><span class="dashboard-focus-label">Sudah bayar</span><strong class="dashboard-focus-value">${val(collected)}</strong></div>
        <div class="dashboard-focus-item"><span class="dashboard-focus-label">Collection rate</span><strong class="dashboard-focus-value">${rate.toLocaleString('id-ID')}%</strong></div>
      </div>
      <div class="dashboard-focus-foot">Nominal tertagih <strong>${val(collected)}</strong> dari total <strong>${val(billed)}</strong>.</div>`;

    const pay=(APP.pembayaran||[]).filter(x=>activeIds.has(String(x['ID Pelanggan']))&&periodKey(x.Period||x.Periode)===p&&!/batal/i.test(String(x.Status||'')));
    const map={};
    pay.forEach(x=>{
      const d=new Date(x['Tanggal Bayar']||x['Tanggal Pembayaran']||x.Timestamp||x.Tanggal||'');
      if(!isNaN(d))map[d.getDate()]=(map[d.getDate()]||0)+num(x.Nominal);
    });

    const z=p.split('-').map(Number),days=Math.max(new Date(z[0],z[1],0).getDate(),1);
    const pts=Array.from({length:days},(_,i)=>map[i+1]||0);
    const max=Math.max(...pts,1),w=640,h=100;
    const coords=pts.map((v,i)=>[10+(days===1?310:i*620/(days-1)),90-(v/max)*70]);
    const line=coords.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ');
    const area=line+' L '+coords[coords.length-1][0]+' 90 L '+coords[0][0]+' 90 Z';
    const total=pts.reduce((x,y)=>x+y,0);
    const lastIndex=pts.reduce((last,v,i)=>v>0?i:last,-1);
    const dot=lastIndex>=0?coords[lastIndex]:coords[coords.length-1];

    $('dashboardTrend').innerHTML=`
      <div class="dashboard-analytics-head">
        <div><div class="dashboard-analytics-title">Tren pendapatan</div><div class="dashboard-analytics-subtitle">Pembayaran tercatat · ${esc(p)}</div></div>
        <div class="dashboard-trend-total">${val(total)}<small>Total diterima</small></div>
      </div>
      <div class="dashboard-chart">
        <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Tren pendapatan ${esc(p)}">
          <line class="chart-grid" x1="10" y1="20" x2="630" y2="20"/><line class="chart-grid" x1="10" y1="50" x2="630" y2="50"/><line class="chart-grid" x1="10" y1="90" x2="630" y2="90"/>
          <path class="chart-area" d="${area}"/><path class="chart-line" d="${line}"/><circle class="chart-point" cx="${dot[0]}" cy="${dot[1]}" r="3"/>
        </svg>
      </div>`;

    stats.querySelectorAll('.stat-card').forEach((c,i)=>{
      c.classList.toggle('unpaid-card',i===2);
      c.classList.toggle('paid-card',i===3);
      let icon=c.querySelector('.dashboard-stat-icon');
      if(!icon){
        icon=document.createElement('span');
        icon.className='dashboard-stat-icon '+['blue','slate','orange','green'][i];
        c.insertBefore(icon,c.firstChild);
      }
      icon.innerHTML=ICONS[i]||'';
    });
  }

  function customers(){
    const t=$('dashboardCustomers');if(!t)return;
    const list=(APP.pelanggan||[]).slice().sort((a,b)=>Number(b._rowIndex||0)-Number(a._rowIndex||0)).slice(0,5);
    t.innerHTML=list.length?list.map(c=>{
      const active=String(c.Status)==='Aktif';
      const p=String(c['Paket Speed']||'').trim();
      const pl=p&&!/mbps/i.test(p)?p+' Mbps':p||'Paket belum diisi';
      return `<div class="dashboard-customer-item"><div class="dashboard-customer-avatar">${esc(initialsOf(c['Nama Pelanggan']))}</div><div class="dashboard-customer-main"><div class="dashboard-customer-name">${esc(c['Nama Pelanggan']||c['ID Pelanggan']||'Pelanggan')}</div><div class="dashboard-customer-meta">${esc(c['ID Pelanggan']||'-')} · ${esc(pl)}</div></div><span class="dashboard-customer-status ${active?'':'is-inactive'}">${active?'Aktif':'Nonaktif'}</span></div>`;
    }).join(''):'<div class="dashboard-empty"><strong>Belum ada pelanggan</strong>Data pelanggan akan tampil di sini.</div>';
  }

  function history(){
    const t=$('dashboardHistory');if(!t)return;
    const list=(APP.auditLog||[]).slice().sort((a,b)=>String(b.Timestamp).localeCompare(String(a.Timestamp))).slice(0,5);
    t.innerHTML=list.length?list.map(a=>`<div class="dashboard-audit-item"><div class="dashboard-audit-dot"></div><div class="dashboard-audit-main"><div class="dashboard-audit-title">${esc(a.Action||'ACTIVITY')} · ${esc(a.Reference||'')}</div><div class="dashboard-audit-desc">${esc(a.Description||'Aktivitas aplikasi')}</div><div class="dashboard-audit-time">${esc(a.User||'User')} · ${dateTimeShort(a.Timestamp)}</div></div></div>`).join(''):'<div class="dashboard-empty"><strong>Belum ada histori</strong>Aktivitas aplikasi akan tampil di sini.</div>';
  }

  window.renderDashboardWidgets=function(){
    const l=$('dashboardPeriodLabel');if(l)l.textContent=period()||'periode terpilih';
    analytics();customers();history();
  };

  const ra=window.renderAll,rd=window.renderDashboard;
  window.renderAll=function(){ra();renderDashboardWidgets()};
  window.renderDashboard=function(){rd();renderDashboardWidgets()};
})();
