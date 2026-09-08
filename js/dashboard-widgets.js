/* ============================================================
 * NUSANTARA WIFI — DASHBOARD WIDGETS
 * Customer + application history widgets.
 * Uses existing APP state only; no backend changes.
 * ============================================================ */
'use strict';

function renderDashboardWidgets(){
  const period=$('billPeriod')?.value||periodNow();
  const label=$('dashboardPeriodLabel');
  if(label) label.textContent=period||'periode terpilih';
  renderDashboardCustomers();
  renderDashboardHistory();
}

function renderDashboardCustomers(){
  const target=$('dashboardCustomers');
  if(!target)return;
  const list=APP.pelanggan.slice().sort((a,b)=>Number(b._rowIndex||0)-Number(a._rowIndex||0)).slice(0,5);
  target.innerHTML=list.length?list.map(c=>{
    const active=String(c.Status)==='Aktif';
    const paket=String(c['Paket Speed']||'').trim();
    const paketLabel=paket&&!/mbps/i.test(paket)?paket+' Mbps':paket||'Paket belum diisi';
    return `<div class="dashboard-customer-item"><div class="dashboard-customer-avatar">${esc(initialsOf(c['Nama Pelanggan']))}</div><div class="dashboard-customer-main"><div class="dashboard-customer-name">${esc(c['Nama Pelanggan']||c['ID Pelanggan']||'Pelanggan')}</div><div class="dashboard-customer-meta">${esc(c['ID Pelanggan']||'-')} · ${esc(paketLabel)}</div></div><span class="dashboard-customer-status ${active?'':'is-inactive'}">${active?'Aktif':'Nonaktif'}</span></div>`;
  }).join(''):'<div class="dashboard-empty"><strong>Belum ada pelanggan</strong>Data pelanggan akan tampil di sini.</div>';
}

function renderDashboardHistory(){
  const target=$('dashboardHistory');
  if(!target)return;
  const list=APP.auditLog.slice().sort((a,b)=>String(b.Timestamp).localeCompare(String(a.Timestamp))).slice(0,5);
  target.innerHTML=list.length?list.map(a=>`<div class="dashboard-audit-item"><div class="dashboard-audit-dot"></div><div class="dashboard-audit-main"><div class="dashboard-audit-title">${esc(a.Action||'ACTIVITY')} · ${esc(a.Reference||'')}</div><div class="dashboard-audit-desc">${esc(a.Description||'Aktivitas aplikasi')}</div><div class="dashboard-audit-time">${esc(a.User||'User')} · ${dateTimeShort(a.Timestamp)}</div></div></div>`).join(''):'<div class="dashboard-empty"><strong>Belum ada histori</strong>Aktivitas aplikasi akan tampil di sini.</div>';
}

const _dashboardOriginalRenderAll=window.renderAll;
window.renderAll=function(){
  _dashboardOriginalRenderAll();
  renderDashboardWidgets();
};

const _dashboardOriginalRenderDashboard=window.renderDashboard;
window.renderDashboard=function(){
  _dashboardOriginalRenderDashboard();
  renderDashboardWidgets();
};
