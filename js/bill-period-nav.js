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

  function periodParts(value){
    const [y,m]=String(value||'').split('-').map(Number);
    return {year:y,month:m};
  }

  function setPeriod(value){
    const select=$('billPeriod');
    if(!select)return;

    // The select remains the single source of truth for the existing billing renderer.
    select.value=value;
    select.dispatchEvent(new Event('change',{bubbles:true}));
    renderNav();
  }

  function renderNav(){
    const select=$('billPeriod'),nav=$('billPeriodNav');
    if(!select||!nav)return;

    const current=select.value||periodNow();
    const prev=shiftPeriod(current,-1);
    const next=shiftPeriod(current,1);
    const now=periodNow();
    const currentParts=periodParts(current);

    nav.innerHTML=`
      <button type="button" class="period-nav-btn period-nav-prev" data-period="${prev}" title="Lihat tagihan bulan lalu">
        <span class="period-nav-arrow" aria-hidden="true">‹</span>
        <span class="period-nav-copy"><small>Bulan lalu</small><strong>${labelPeriod(prev)}</strong></span>
      </button>
      <button type="button" class="period-nav-current ${current===now?'is-current':''}" data-period="${now}" title="Kembali ke tagihan bulan ini">
        <span class="period-nav-copy"><small>${current===now?'Periode aktif':'Kembali ke'}</small><strong>${current===now?'Bulan ini':labelPeriod(now)}</strong></span>
      </button>
      <button type="button" class="period-nav-btn period-nav-next" data-period="${next}" title="Lihat tagihan bulan depan">
        <span class="period-nav-copy"><small>Bulan depan</small><strong>${labelPeriod(next)}</strong></span>
        <span class="period-nav-arrow" aria-hidden="true">›</span>
      </button>
    `;

    nav.querySelectorAll('[data-period]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        if(btn.dataset.period===current)return;
        nav.classList.add('is-switching');
        setPeriod(btn.dataset.period);
        window.setTimeout(()=>nav.classList.remove('is-switching'),180);
      });
    });

    const caption=$('billPeriodCaption');
    if(caption){
      caption.textContent=labelPeriod(current);
      caption.title=`Periode ${currentParts.year}-${String(currentParts.month).padStart(2,'0')}`;
    }
  }

  function populatePeriodOptions(){
    const select=$('billPeriod');
    if(!select)return;

    const existing=new Set();
    (APP.tagihan||[]).forEach(b=>{
      const p=periodKey(b.Period||b.Periode);
      if(p)existing.add(p);
    });

    const now=periodNow();
    existing.add(now);
    existing.add(shiftPeriod(now,-1));
    existing.add(shiftPeriod(now,1));

    const values=[...existing].sort().reverse();
    const current=select.value||now;
    select.innerHTML=values.map(p=>`<option value="${p}">${labelPeriod(p)}</option>`).join('');
    select.value=values.includes(current)?current:now;
  }

  function init(){
    const select=$('billPeriod'),nav=$('billPeriodNav');
    if(!select||!nav)return;

    // The navigation markup already exists in index.html.
    // Do NOT abort merely because #billPeriodNav exists.
    const toolbar=select.closest('.toolbar');
    if(!toolbar)return;

    select.classList.add('bill-period-select');
    select.setAttribute('aria-label','Pilih periode tagihan');

    if(!select.dataset.periodNavBound){
      select.addEventListener('change',()=>{
        renderNav();
        // Keep the original app renderer responsible for the table/dashboard.
      });
      select.dataset.periodNavBound='1';
    }

    populatePeriodOptions();
    renderNav();
  }

  window.refreshBillPeriodNav=function(){
    populatePeriodOptions();
    renderNav();
  };

  document.addEventListener('DOMContentLoaded',()=>setTimeout(init,80),{once:true});
})();
