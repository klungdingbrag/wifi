/* ============================================================
 * NUSANTARA WIFI — PAYMENT ACTIONS
 * Loaded after app.js. Keeps cancellation + payment UX in one layer.
 * ============================================================ */
'use strict';

function paymentButtonUI(state, message) {
  const btn = document.getElementById('paymentSaveBtn');
  if (!btn) return;
  if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent.trim() || 'Simpan pembayaran';

  if (state === 'saving') {
    btn.disabled = true;
    btn.classList.remove('is-success');
    btn.classList.add('is-saving');
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = '<span class="payment-spinner" aria-hidden="true"></span><span>Menyimpan...</span>';
    return;
  }

  if (state === 'success') {
    btn.disabled = true;
    btn.classList.remove('is-saving');
    btn.classList.add('is-success');
    btn.removeAttribute('aria-busy');
    btn.innerHTML = '<span class="payment-check" aria-hidden="true">✓</span><span>' + (message || 'Tersimpan') + '</span>';
    return;
  }

  btn.disabled = false;
  btn.classList.remove('is-saving', 'is-success');
  btn.removeAttribute('aria-busy');
  btn.textContent = btn.dataset.originalText || 'Simpan pembayaran';
}

function openPaymentModal(row) {
  const b = findBillByRow(row);
  if (!b) return toast('Tagihan tidak ditemukan.', true);
  if (String(b.Status) === 'Lunas') return toast('Tagihan ini sudah lunas.', true);
  if (!isBillOperational(b)) return toast('Pelanggan tidak aktif atau tagihan tidak dapat diproses.', true);

  $('paymentRowIndex').value = b._rowIndex;
  $('paymentMethod').value = 'Tunai';
  $('paymentNote').value = '';
  $('paymentSummary').innerHTML =
    `<strong>${esc(b.Nama || findCustomer(b['ID Pelanggan'])?.['Nama Pelanggan'] || b['ID Pelanggan'])}</strong>` +
    `<span>${esc(b['ID Tagihan'])} · ${esc(periodKey(b.Period ?? b.Periode))} · ${money(b.Nominal)}</span>`;
  paymentButtonUI('idle');
  $('paymentModal').classList.remove('hidden');
}

/*
 * Payment is confirmed by the backend response itself.
 * billId is sent explicitly so the server can resolve the exact invoice
 * even if the table row changes after a refresh.
 */
async function savePayment(e) {
  e.preventDefault();

  const row = Number($('paymentRowIndex').value);
  const b = findBillByRow(row);
  const method = $('paymentMethod').value;
  const note = $('paymentNote').value.trim();
  const btn = $('paymentSaveBtn');

  if (!b) return toast('Tagihan tidak ditemukan. Silakan buka ulang tagihan.', true);
  if (String(b.Status) === 'Lunas') return toast('Tagihan ini sudah lunas.', true);
  if (!b['ID Tagihan']) return toast('ID tagihan tidak tersedia.', true);
  if (!method) return toast('Metode pembayaran wajib dipilih.', true);
  if (btn?.disabled) return;

  paymentButtonUI('saving');

  try {
    const result = await apiPost('payBill', {
      rowIndex: row,
      billId: b['ID Tagihan'],
      method,
      note
    });

    if (!result || result.success === false) {
      throw new Error(result?.message || 'Backend tidak mengonfirmasi pembayaran.');
    }

    /* Backend V6.4 returns success only after the payment + invoice update
       has completed successfully. Therefore show success only here. */
    paymentButtonUI('success', 'Tersimpan');
    toast(result.message || 'Pembayaran berhasil dicatat.');

    closeModal('paymentModal');
    await loadInitialData();
  } catch (err) {
    console.error(err);
    paymentButtonUI('error');
    toast(errorMessage(err), true);
  }
}

function cancelPayment(row) {
  const b = findBillByRow(row);
  if (!b) return toast('Tagihan tidak ditemukan.', true);
  if (String(b.Status) !== 'Lunas') return toast('Tagihan ini belum berstatus Lunas.', true);

  const name = b.Nama || findCustomer(b['ID Pelanggan'])?.['Nama Pelanggan'] || b['ID Pelanggan'];
  const confirmed = confirm(
    'Batalkan pembayaran ini?\n\n' +
    name + '\n' +
    b['ID Tagihan'] + ' · ' + periodKey(b.Period ?? b.Periode) + '\n' +
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
    return `<div class="outstanding-item"><div><div class="item-name">${esc(name)}</div><div class="item-meta">${esc(periodKey(b.Period ?? b.Periode))} · jatuh tempo ${dateShort(b['Jatuh Tempo'])}</div></div><div class="item-money">${money(b.Nominal)}<small>Belum bayar</small></div></div>`;
  }
  const paymentAction = unpaid
    ? `<button class="btn btn-primary btn-mini" onclick="openPaymentModal(${Number(b._rowIndex)})">Bayar</button>`
    : `<button class="btn btn-soft btn-mini" onclick="cancelPayment(${Number(b._rowIndex)})">Batalkan</button>`;
  return `<tr><td><div class="primary-text">${esc(name)}</div><div class="muted-text">${esc(b['ID Pelanggan'])}</div></td><td>${esc(periodKey(b.Period ?? b.Periode))}</td><td>${dateShort(b['Jatuh Tempo'])}</td><td class="money">${money(b.Nominal)}</td><td><span class="badge ${unpaid?'badge-unpaid':'badge-paid'}">${esc(b.Status)}</span></td><td><div class="table-actions">${paymentAction}<button class="btn btn-success btn-mini" onclick="sendBillWA(${Number(b._rowIndex)})">WA</button></div></td></tr>`;
}

function renderPayments() {
  const list = APP.pembayaran.slice().sort((a,b)=>String(b['Tanggal Bayar']).localeCompare(String(a['Tanggal Bayar'])));
  $('paymentEmpty')?.classList.toggle('hidden', list.length > 0);
  $('paymentTableBody').innerHTML = list.map(p => {
    const status = String(p.Status || 'Valid');
    const canceled = status === 'Dibatalkan';
    return `<tr><td><span class="primary-text">${esc(p['ID Pembayaran'])}</span></td><td><div class="primary-text">${esc(p['Nama Pelanggan']||findCustomer(p['ID Pelanggan'])?.['Nama Pelanggan']||'-')}</div><div class="muted-text">${esc(p['ID Pelanggan'])}</div></td><td>${esc(periodKey(p.Period ?? p.Periode))}</td><td class="money">${money(p.Nominal)}</td><td>${dateShort(p['Tanggal Bayar'])}</td><td>${esc(p.Metode||'-')} <span class="badge ${canceled?'badge-unpaid':'badge-paid'}">${esc(status)}</span></td></tr>`;
  }).join('');
}

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

function renderBills(){
  const q=String($('billSearch')?.value||'').toLowerCase().trim();
  const period=$('billPeriod')?.value||periodNow();
  const status=$('billStatus')?.value||'';
  const ids=getActiveCustomerIds();
  const list=APP.tagihan.filter(b=>{
    const hay=[b['ID Tagihan'],b['ID Pelanggan'],b['Nama'],billPeriodValue(b)].join(' ').toLowerCase();
    return ids.has(String(b['ID Pelanggan'])) && periodKey(billPeriodValue(b))===period && (!q||hay.includes(q)) && (!status||b.Status===status);
  });
  if(!$('billTableBody')) return;
  $('billTableBody').innerHTML=list.map(b=>billRow(b,false)).join('');
  $('billEmpty')?.classList.toggle('hidden',list.length>0);
}
