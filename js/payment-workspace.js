/* ============================================================
 * NUSANTARA WIFI — PAYMENT WORKSPACE
 * Transaction Center: filters, transaction detail and operational UX.
 * ============================================================ */
(function(){
  'use strict';

  function safePeriod(p){return typeof periodKey==='function'?periodKey(p):String(p||'').slice(0,7)}
  function cancelled(p){return String(p?.Status||'Valid').trim()==='Dibatalkan'}
  function paymentName(p){return p?.['Nama Pelanggan']||findCustomer(p?.['ID Pelanggan'])?.['Nama Pelanggan']||p?.['ID Pelanggan']||'-'}
  function paymentBillId(p){return p?.['ID Tagihan']||p?.BillId||p?.['Bill ID']||''}
  function paymentDate(p){return String(p?.['Tanggal Bayar']||'').slice(0,10)}

  function installStyles(){
    if(document.getElementById('paymentWorkspaceStyle'))return;
    const s=document.createElement('style');s.id='paymentWorkspaceStyle';s.textContent=`
      .payment-workspace{display:grid;gap:16px;margin-bottom:16px}
      .payment-filters{display:grid;grid-template-columns:minmax(220px,1fr) 150px 170px 150px;gap:10px}
      .payment-filter-label{font-size:10px;font-weight:800;letter-spacing:.06em;color:var(--muted,#718096);margin:0 0 5px}
      .payment-filter-field{min-width:0}
      .transaction-row{cursor:pointer}
      .transaction-row:hover{background:var(--bg-soft,#f6f8fb)}
      .transaction-id{font-weight:750;color:var(--primary,#587da5)}
      .transaction-method{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
      .transaction-cancelled{opacity:.62}
      .transaction-empty-note{font-size:12px;color:var(--muted,#718096)}
      .transaction-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}
      .transaction-detail-box{padding:13px;border:1px solid var(--border,#e3eaf1);border-radius:12px;background:var(--bg-soft,#f8fafc)}
      .transaction-detail-box span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#718096);margin-bottom:4px}
      .transaction-detail-box strong{font-size:14px;word-break:break-word}
      .transaction-detail-total{margin-top:14px;padding:16px;border-radius:14px;background:linear-gradient(135deg,rgba(23,184,220,.08),rgba(88,125,165,.08));display:flex;justify-content:space-between;align-items:center;gap:12px}
      .transaction-detail-total span{font-size:11px;color:var(--muted,#718096)}
      .transaction-detail-total strong{font-size:22px;color:var(--primary,#587da5)}
      .transaction-detail-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
      @media(max-width:800px){.payment-filters{grid-template-columns:1fr 1fr}.payment-filters .search-field{grid-column:1/-1}}
      @media(max-width:520px){.payment-filters{grid-template-columns:1fr}.payment-filters .search-field{grid-column:auto}.transaction-detail-grid{grid-template-columns:1fr}.transaction-detail-total{align-items:flex-start;flex-direction:column}}
    `;document.head.appendChild(s);
  }

  function installWorkspace(){
    const page=document.getElementById('page-pembayaran');
    if(!page||document.getElementById('paymentWorkspace'))return;
    const summary=document.getElementById('paymentModuleSummary');
    const wrap=document.createElement('div');wrap.id='paymentWorkspace';wrap.className='payment-workspace';
    wrap.innerHTML=`<div class="toolbar payment-filters">
      <div class="payment-filter-field search-field"><div class="payment-filter-label">CARI TRANSAKSI</div><input id="paymentSearch" class="input" placeholder="ID pembayaran, pelanggan, ID tagihan..."/></div>
      <div class="payment-filter-field"><div class="payment-filter-label">PERIODE</div><select id="paymentPeriod" class="input"></select></div>
      <div class="payment-filter-field"><div class="payment-filter-label">METODE</div><select id="paymentMethodFilter" class="input"><option value="">Semua metode</option><option>Tunai</option><option>Transfer Bank</option><option>E-Wallet</option><option>Lainnya</option></select></div>
      <div class="payment-filter-field"><div class="payment-filter-label">STATUS</div><select id="paymentStatusFilter" class="input"><option value="">Semua status</option><option>Valid</option><option>Dibatalkan</option></select></div>
    </div>`;
    if(summary)summary.insertAdjacentElement('afterend',wrap);else page.querySelector('.page-intro')?.insertAdjacentElement('afterend',wrap);
    const modal=document.createElement('div');modal.id='paymentDetailModal';modal.className='modal hidden';modal.innerHTML=`<div class="modal-backdrop" data-close="paymentDetailModal"></div><div class="modal-card small-modal"><div class="modal-head"><div><div class="panel-kicker">TRANSACTION DETAIL</div><h3 id="paymentDetailTitle">Detail Pembayaran</h3></div><button class="modal-close" data-close="paymentDetailModal">×</button></div><div id="paymentDetailContent"></div></div>`;document.body.appendChild(modal);
  }

  function populatePeriods(){
    const sel=document.getElementById('paymentPeriod');if(!sel)return;
    const values=new Set();
    APP.pembayaran.forEach(p=>{const v=safePeriod(p.Period||p.Periode);if(/^\d{4}-\d{2}$/.test(v))values.add(v)});
    const current=periodNow();values.add(current);
    const options=Array.from(values).sort().reverse();
    sel.innerHTML=options.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
    const billPeriod=document.getElementById('billPeriod');
    if(billPeriod&&options.includes(billPeriod.value))sel.value=billPeriod.value;else sel.value=current;
  }

  function getFiltered(){
    const q=String(document.getElementById('paymentSearch')?.value||'').toLowerCase().trim();
    const period=document.getElementById('paymentPeriod')?.value||'';
    const method=document.getElementById('paymentMethodFilter')?.value||'';
    const status=document.getElementById('paymentStatusFilter')?.value||'';
    return APP.pembayaran.filter(p=>{
      const st=String(p.Status||'Valid');
      const hay=[p['ID Pembayaran'],paymentName(p),p['ID Pelanggan'],paymentBillId(p),safePeriod(p.Period||p.Periode),p.Metode].join(' ').toLowerCase();
      return (!q||hay.includes(q))&&(!period||safePeriod(p.Period||p.Periode)===period)&&(!method||String(p.Metode||'')===method)&&(!status||st===status);
    }).sort((a,b)=>paymentDate(b).localeCompare(paymentDate(a))||String(b['ID Pembayaran']||'').localeCompare(String(a['ID Pembayaran']||'')));
  }

  function renderWorkspace(){
    const body=document.getElementById('paymentTableBody');if(!body)return;
    const list=getFiltered();
    body.innerHTML=list.map(p=>{
      const st=String(p.Status||'Valid'),bad=st==='Dibatalkan';
      return `<tr class="transaction-row ${bad?'transaction-cancelled':''}" data-payment-id="${esc(p['ID Pembayaran']||'')}"><td><span class="transaction-id">${esc(p['ID Pembayaran']||'-')}</span></td><td><div class="primary-text">${esc(paymentName(p))}</div><div class="muted-text">${esc(p['ID Pelanggan']||'-')}</div></td><td>${esc(safePeriod(p.Period||p.Periode))}</td><td class="money">${money(p.Nominal)}</td><td>${dateShort(p['Tanggal Bayar'])}</td><td><div class="transaction-method">${esc(p.Metode||'-')} <span class="badge ${bad?'badge-unpaid':'badge-paid'}">${esc(st)}</span></div></td></tr>`;
    }).join('');
    document.getElementById('paymentEmpty')?.classList.toggle('hidden',list.length>0);
    body.querySelectorAll('.transaction-row').forEach(row=>row.addEventListener('click',()=>openDetail(row.dataset.paymentId)));
  }

  function openDetail(id){
    const p=APP.pembayaran.find(x=>String(x['ID Pembayaran'])===String(id));if(!p)return;
    const st=String(p.Status||'Valid'),bad=st==='Dibatalkan',billId=paymentBillId(p);
    const bill=billId?APP.tagihan.find(b=>String(b['ID Tagihan'])===String(billId)):null;
    const c=findCustomer(p['ID Pelanggan']);
    document.getElementById('paymentDetailTitle').textContent=p['ID Pembayaran']||'Detail Pembayaran';
    document.getElementById('paymentDetailContent').innerHTML=`
      <div class="transaction-detail-total"><div><span>Nominal transaksi</span><strong>${money(p.Nominal)}</strong></div><span class="badge ${bad?'badge-unpaid':'badge-paid'}">${esc(st)}</span></div>
      <div class="transaction-detail-grid">
        <div class="transaction-detail-box"><span>Pelanggan</span><strong>${esc(paymentName(p))}</strong></div>
        <div class="transaction-detail-box"><span>ID Pelanggan</span><strong>${esc(p['ID Pelanggan']||'-')}</strong></div>
        <div class="transaction-detail-box"><span>Periode</span><strong>${esc(safePeriod(p.Period||p.Periode)||'-')}</strong></div>
        <div class="transaction-detail-box"><span>Tanggal pembayaran</span><strong>${esc(dateShort(p['Tanggal Bayar']))}</strong></div>
        <div class="transaction-detail-box"><span>Metode</span><strong>${esc(p.Metode||'-')}</strong></div>
        <div class="transaction-detail-box"><span>ID Tagihan</span><strong>${esc(billId||'-')}</strong></div>
        <div class="transaction-detail-box"><span>No. WhatsApp</span><strong>${esc(c?.['No WhatsApp']||'-')}</strong></div>
        <div class="transaction-detail-box"><span>Catatan</span><strong>${esc(p.Catatan||p.Note||'-')}</strong></div>
      </div>
      ${!bad&&bill?`<div class="transaction-detail-actions"><button class="btn btn-soft" id="paymentDetailCancel">Batalkan pembayaran</button></div>`:''}`;
    const cancel=document.getElementById('paymentDetailCancel');
    if(cancel)cancel.addEventListener('click',()=>{closeModal('paymentDetailModal');cancelPayment(bill._rowIndex)});
    document.getElementById('paymentDetailModal')?.classList.remove('hidden');
  }

  function syncSummary(){
    if(typeof renderModuleSummaries==='function')renderModuleSummaries();
  }

  function bind(){
    ['paymentSearch','paymentMethodFilter','paymentStatusFilter'].forEach(id=>document.getElementById(id)?.addEventListener(id==='paymentSearch'?'input':'change',renderWorkspace));
    document.getElementById('paymentPeriod')?.addEventListener('change',function(){
      const billPeriod=document.getElementById('billPeriod');if(billPeriod)billPeriod.value=this.value;
      if(typeof refreshBillPeriodNav==='function')refreshBillPeriodNav();
      renderWorkspace();syncSummary();
    });
    document.getElementById('paymentTableBody')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.closest('.transaction-row'))e.target.closest('.transaction-row').click()});
  }

  function refresh(){populatePeriods();renderWorkspace();syncSummary();}

  window.addEventListener('DOMContentLoaded',()=>{
    installStyles();installWorkspace();populatePeriods();bind();
    setTimeout(refresh,80);
  });

  const oldRenderAll=window.renderAll;
  if(oldRenderAll)window.renderAll=function(){oldRenderAll();setTimeout(refresh,0)};
  window.refreshPaymentWorkspace=refresh;
})();
