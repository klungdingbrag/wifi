/* Nusantara WiFi — compact module summaries */
(function(){
  'use strict';

  function moneySafe(v){
    try{return typeof money==='function'?money(v):'Rp'+Number(v||0).toLocaleString('id-ID')}
    catch(e){return 'Rp0'}
  }
  function numSafe(v){
    return typeof num==='function'?num(v):Number(String(v||0).replace(/[^0-9-]/g,''))||0
  }
  function periodSafe(v){
    return typeof periodKey==='function'?periodKey(v):String(v||'').slice(0,7)
  }

  function renderModuleSummaries(){
    const active=APP.pelanggan.filter(c=>String(c.Status)==='Aktif');
    const activeIds=new Set(active.map(c=>String(c['ID Pelanggan'])));
    const bills=APP.tagihan;
    const payments=APP.pembayaran;
    const period=$('billPeriod')?.value||periodNow();

    // Billing summary must follow the same operational scope as the Billing table:
    // only active customers + the selected period. Historical/inactive invoices
    // remain in APP.tagihan and can still be preserved for audit/history.
    const periodBills=bills.filter(b=>
      activeIds.has(String(b['ID Pelanggan'])) &&
      periodSafe(b.Period||b.Periode)===period
    );
    const paidBills=periodBills.filter(b=>String(b.Status)==='Lunas');
    const unpaid=periodBills.filter(b=>String(b.Status)!=='Lunas');
    const billedAmount=periodBills.reduce((s,b)=>s+numSafe(b.Nominal),0);
    const paidAmount=paidBills.reduce((s,b)=>s+numSafe(b.Nominal),0);
    const collectionRate=billedAmount>0?(paidAmount/billedAmount*100):0;

    const periodPayments=payments.filter(p=>periodSafe(p.Period||p.Periode)===period);
    const revenue=periodPayments
      .filter(p=>String(p.Status||'').toLowerCase()!=='dibatalkan')
      .reduce((s,p)=>s+numSafe(p.Nominal),0);

    const set=(id,items)=>{
      const el=$(id);
      if(el)el.innerHTML=items.map(x=>`<div class="module-kpi"><div class="module-kpi-label">${x[0]}</div><div class="module-kpi-value">${x[1]}</div><div class="module-kpi-note">${x[2]}</div></div>`).join('')
    };

    set('billModuleSummary',[
      ['Total tagihan',periodBills.length,`Periode ${period}`],
      ['Belum bayar',unpaid.length,moneySafe(unpaid.reduce((s,b)=>s+numSafe(b.Nominal),0))],
      ['Lunas',paidBills.length,moneySafe(paidAmount)],
      ['Collection rate',collectionRate.toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2})+'%','Berdasarkan nominal']
    ]);

    set('customerModuleSummary',[
      ['Pelanggan aktif',active.length,'Layanan berjalan'],
      ['Total pelanggan',APP.pelanggan.length,'Termasuk nonaktif'],
      ['Paket terisi',active.filter(c=>String(c['Paket Speed']||'').trim()).length,'Pelanggan aktif'],
      ['Rata-rata tarif',active.length?moneySafe(active.reduce((s,c)=>s+numSafe(c['Tarif Bulanan']),0)/active.length):'Rp0','Per pelanggan aktif']
    ]);

    set('paymentModuleSummary',[
      ['Pembayaran periode',periodPayments.length,`Periode ${period}`],
      ['Penerimaan',moneySafe(revenue),'Transaksi tercatat'],
      ['Rata-rata transaksi',periodPayments.length?moneySafe(revenue/periodPayments.length):'Rp0','Per transaksi'],
      ['Lunas billing',paidBills.length,`Dari ${periodBills.length} tagihan`]
    ]);

    const today=new Date().toISOString().slice(0,10);
    set('historyModuleSummary',[
      ['Aktivitas',APP.auditLog.length,'Total histori'],
      ['Hari ini',APP.auditLog.filter(a=>String(a.Timestamp||'').slice(0,10)===today).length,'Aktivitas hari ini'],
      ['Pembayaran',APP.auditLog.filter(a=>/pay|bayar|payment/i.test(String(a.Action||'')+' '+String(a.Description||''))).length,'Aktivitas terkait pembayaran'],
      ['Pelanggan',APP.auditLog.filter(a=>/customer|pelanggan/i.test(String(a.Action||'')+' '+String(a.Description||''))).length,'Aktivitas terkait pelanggan']
    ]);
  }

  window.addEventListener('DOMContentLoaded',()=>setTimeout(renderModuleSummaries,50));
  const oldRenderAll=window.renderAll;
  if(oldRenderAll)window.renderAll=function(){oldRenderAll();renderModuleSummaries()};
  const oldRenderDashboard=window.renderDashboard;
  if(oldRenderDashboard)window.renderDashboard=function(){oldRenderDashboard();renderModuleSummaries()};
  window.renderModuleSummaries=renderModuleSummaries;
})();
