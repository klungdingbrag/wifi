/* NUSANTARA WIFI — CUSTOMER WORKSPACE V1 */
'use strict';
(function(){
  const $=id=>document.getElementById(id);
  let sortMode='latest';

  function ensureSortControl(){
    const toolbar=$('customerSearch')?.closest('.toolbar');
    if(!toolbar||$('customerSort'))return;
    const select=document.createElement('select');
    select.id='customerSort';
    select.className='input compact-input';
    select.setAttribute('aria-label','Urutkan pelanggan');
    select.innerHTML='<option value="latest">Terbaru</option><option value="name">Nama A–Z</option><option value="tariff">Tarif tertinggi</option><option value="status">Status</option>';
    select.value=sortMode;
    select.addEventListener('change',()=>{sortMode=select.value;applySort()});
    toolbar.appendChild(select);
  }

  function applySort(){
    const grid=$('customerGrid');
    if(!grid)return;
    const cards=[...grid.querySelectorAll('.customer-card')];
    const customers=APP.pelanggan||[];
    const rowOf=card=>Number(card.querySelector('.customer-actions button')?.getAttribute('onclick')?.match(/\d+/)?.[0]||0);
    cards.sort((a,b)=>{
      const ca=customers.find(c=>Number(c._rowIndex)===rowOf(a))||{};
      const cb=customers.find(c=>Number(c._rowIndex)===rowOf(b))||{};
      if(sortMode==='name')return String(ca['Nama Pelanggan']||'').localeCompare(String(cb['Nama Pelanggan']||''),'id');
      if(sortMode==='tariff')return Number(cb['Tarif Bulanan']||0)-Number(ca['Tarif Bulanan']||0);
      if(sortMode==='status')return String(cb.Status||'').localeCompare(String(ca.Status||''));
      return Number(cb._rowIndex||0)-Number(ca._rowIndex||0);
    });
    cards.forEach(c=>grid.appendChild(c));
  }

  function enhanceCards(){
    const grid=$('customerGrid');
    if(!grid)return;
    grid.querySelectorAll('.customer-card').forEach(card=>{
      if(card.querySelector('.customer-card-accent'))return;
      const status=card.querySelector('.badge')?.textContent?.trim()||'';
      const accent=document.createElement('span');
      accent.className='customer-card-accent '+(status==='Aktif'?'is-active':'is-inactive');
      accent.setAttribute('aria-hidden','true');
      card.insertBefore(accent,card.firstChild);
    });
    applySort();
  }

  function refresh(){
    ensureSortControl();
    enhanceCards();
  }

  const old=window.renderCustomers;
  if(old)window.renderCustomers=function(){old();refresh()};
  window.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,100));
  window.refreshCustomerWorkspace=refresh;
})();
