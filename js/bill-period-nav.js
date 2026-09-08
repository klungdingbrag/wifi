/* ============================================================
 * NUSANTARA WIFI — BILLING PERIOD NAVIGATION
 * UI only. Keeps the existing billing data/filter logic intact.
 * ============================================================ */
(function(){
  'use strict';

  const $ = id => document.getElementById(id);

  function shiftPeriod(base, delta){
    const [y,m]=String(base||'').split('-').map(Number);
    const d=new Date(y||new Date().getFullYear(),(m||new Date().getMonth()+1)-1+delta,1);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  }

  function labelPeriod(value){
    const [y,m]=String(value||'').split('-').map(Number);
    if(!y||!m)return value||'-';
    return new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric'}).format(new Date(y,m-1,1));
  }

  function setPeriod(value){
    const select=$('billPeriod');
    if(!select)return;
    select.value=value;
    // Keep the existing renderer as the single source of truth.
    select.dispatchEvent(new Event('change',{bubbles:true}));
    renderNav();
  }

  function renderNav(){
    const select=$('billPeriod'),nav=$('billPeriodNav');
    if(!select||!nav)return;
    const current=select.value||periodNow();
    const prev=shiftPeriod(current,-1), next=shiftPeriod(current,1), now=periodNow();
    nav.innerHTML=`
      <button type="button" class="period-nav-btn" data-period="${prev}" title="Lihat tagihan bulan sebelumnya">‹ <span>${labelPeriod(prev)}</span></button>
      <button type="button" class="period-nav-current ${current===now?'is-current':''}" data-period="${now}" title="Kembali ke bulan ini">${current===now?'Bulan ini':'Kembali ke bulan ini'}</button>
      <button type="button" class="period-nav-btn" data-period="${next}" title="Lihat tagihan bulan berikutnya"><span>${labelPeriod(next)}</span> ›</button>
    `;
    nav.querySelectorAll('[data-period]').forEach(btn=>btn.addEventListener('click',()=>setPeriod(btn.dataset.period)));
    const caption=$('billPeriodCaption');
    if(caption)caption.textContent=labelPeriod(current);
  }

  function populatePeriodOptions(){
    const select=$('billPeriod');
    if(!select)return;
    const existing=new Set();
    APP.tagihan.forEach(b=>{const p=periodKey(b.Period||b.Periode);if(p)existing.add(p)});
    const now=periodNow();
    existing.add(now); existing.add(shiftPeriod(now,-1)); existing.add(shiftPeriod(now,1));
    const values=[...existing].sort().reverse();
    const current=select.value||now;
    select.innerHTML=values.map(p=>`<option value="${p}">${labelPeriod(p)}</option>`).join('');
    select.value=values.includes(current)?current:now;
  }

  function init(){
    const select=$('billPeriod');
    if(!select)return;
    const toolbar=select.closest('.toolbar');
    if(!toolbar||$('billPeriodNav'))return;

    const wrap=document.createElement('div');
    wrap.className='bill-period-wrap';
    wrap.innerHTML=`<div class="bill-period-heading"><span>Periode tagihan</span><strong id="billPeriodCaption"></strong></div><div id="billPeriodNav" class="bill-period-nav"></div>`;
    toolbar.insertBefore(wrap,select);
    select.classList.add('bill-period-select');
    select.setAttribute('aria-label','Pilih periode tagihan');

    select.addEventListener('change',renderNav);
    populatePeriodOptions();
    renderNav();
  }

  window.refreshBillPeriodNav=function(){
    populatePeriodOptions();
    renderNav();
  };

  document.addEventListener('DOMContentLoaded',()=>setTimeout(init,80),{once:true});
})();
