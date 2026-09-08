/* ============================================================
 * NUSANTARA WIFI — CANCEL PAYMENT UI
 * Loaded after app.js. Adds safe payment cancellation.
 * ============================================================ */
'use strict';

function cancelPayment(row) {
  const b = findBillByRow(row);
  if (!b) return toast('Tagihan tidak ditemukan.', true);
  if (String(b.Status) !== 'Lunas') return toast('Tagihan ini belum berstatus Lunas.', true);

  const name = b.Nama || findCustomer(b['ID Pelanggan'])?.['Nama Pelanggan'] || b['ID Pelanggan'];
  const confirmed = confirm(
    'Batalkan pembayaran ini?\n\n' +
    name + '\n' +
    b['ID Tagihan'] + ' · ' + periodKey(b.Period) + '\n' +
    money(b.Nominal) + '\n\n' +
    'Status tagihan akan dikembalikan menjadi Belum Bayar.\n' +
    'Riwayat pembayaran tidak dihapus; transaksi akan ditandai Dibatalkan.'
  );
  if (!confirmed) return;

  const reason = prompt('Alasan pembatalan (opsional):', 'Salah klik / pembayaran dibatalkan');
  if (reason === null) return;

  apiPost('cancelPayment', {
    billId: b['ID Tagihan'],
    reason: reason.trim()
  }).then(r => {
    toast(r?.message || 'Pembayaran berhasil dibatalkan.');
    loadInitialData();
  }).catch(err => toast(errorMessage(err), true));
}

/* Replace billing row renderer so paid invoices have a Batalkan action. */
function billRow(b, dashboard=false) {
  const customer = findCustomer(b['ID Pelanggan']);
  const name = b['Nama'] || customer?.['Nama Pelanggan'] || b['ID Pelanggan'];
  const unpaid = b.Status !== 'Lunas';
  if (dashboard) {
    return `<div class="outstanding-item"><div><div class="item-name">${esc(name)}</div><div class="item-meta">${esc(periodKey(b.Period))} · jatuh tempo ${dateShort(b['Jatuh Tempo'])}</div></div><div class="item-money">${money(b.Nominal)}<small>Belum bayar</small></div></div>`;
  }
  const paymentAction = unpaid
    ? `<button class="btn btn-primary btn-mini" onclick="openPaymentModal(${Number(b._rowIndex)})">Bayar</button>`
    : `<button class="btn btn-soft btn-mini" onclick="cancelPayment(${Number(b._rowIndex)})">Batalkan</button>`;
  return `<tr><td><div class="primary-text">${esc(name)}</div><div class="muted-text">${esc(b['ID Pelanggan'])}</div></td><td>${esc(periodKey(b.Period))}</td><td>${dateShort(b['Jatuh Tempo'])}</td><td class="money">${money(b.Nominal)}</td><td><span class="badge ${unpaid?'badge-unpaid':'badge-paid'}">${esc(b.Status)}</span></td><td><div class="table-actions">${paymentAction}<button class="btn btn-success btn-mini" onclick="sendBillWA(${Number(b._rowIndex)})">WA</button></div></td></tr>`;
}

/* Show payment status in the payment history without breaking old records. */
function renderPayments() {
  const list = APP.pembayaran.slice().sort((a,b)=>String(b['Tanggal Bayar']).localeCompare(String(a['Tanggal Bayar'])));
  $('paymentEmpty')?.classList.toggle('hidden', list.length > 0);
  $('paymentTableBody').innerHTML = list.map(p => {
    const status = String(p.Status || 'Valid');
    const canceled = status === 'Dibatalkan';
    return `<tr><td><span class="primary-text">${esc(p['ID Pembayaran'])}</span></td><td><div class="primary-text">${esc(p['Nama Pelanggan']||findCustomer(p['ID Pelanggan'])?.['Nama Pelanggan']||'-')}</div><div class="muted-text">${esc(p['ID Pelanggan'])}</div></td><td>${esc(periodKey(p.Period))}</td><td class="money">${money(p.Nominal)}</td><td>${dateShort(p['Tanggal Bayar'])}</td><td>${esc(p.Metode||'-')} <span class="badge ${canceled?'badge-unpaid':'badge-paid'}">${esc(status)}</span></td></tr>`;
  }).join('');
}

/* Dashboard fix: the backend uses the canonical Period field. Older data may use Periode.
 * Keep both forms supported so the UI never silently shows zero billing data. */
function billPeriodValue(b){ return b?.Period ?? b?.Periode ?? ''; }
function renderDashboard(){
  const active = APP.pelanggan.filter(c => String(c.Status) === 'Aktif');
  const ids = new Set(active.map(c => String(c['ID Pelanggan'])));
  const period = $('billPeriod')?.value || periodNow();
  const bills = APP.tagihan.filter(b => ids.has(String(b['ID Pelanggan'])) && periodKey(billPeriodValue(b)) === period);
  const unpaid = bills.filter(b => String(b.Status) !== 'Lunas');
  const paid = bills.filter(b => String(b.Status) === 'Lunas');

  if ($('statCustomers')) $('statCustomers').textContent = active.length;
  if ($('statBills')) $('statBills').textContent = bills.length;
  if ($('statOutstanding')) $('statOutstanding').textContent = money(unpaid.reduce((s,b)=>s+num(b.Nominal),0));
  if ($('statPaid')) $('statPaid').textContent = money(paid.reduce((s,b)=>s+num(b.Nominal),0));

  const target = $('dashboardOutstanding');
  if (!target) return;
  target.innerHTML = unpaid.length
    ? `<div class="list-stack">${unpaid.slice(0,6).map(b=>billRow(b,true)).join('')}</div>`
    : '<div class="empty-state"><div class="empty-icon">✓</div><strong>Semua tagihan aman</strong><span>Tidak ada tagihan aktif yang perlu ditindaklanjuti.</span></div>';
}
