/**
 * ============================================================
 * NUSANTARA WIFI V5 — BACKEND
 * ============================================================
 */

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function okResponse_(data) {
  return jsonResponse_({ success: true, data: data });
}

function errorResponse_(err) {
  return jsonResponse_({ success: false, message: err && err.message ? err.message : String(err) });
}

function doGet(e) {
  try {
    const action = String(e?.parameter?.action || 'getInitialData');
    if (action === 'getInitialData') return okResponse_(getInitialData());
    if (action === 'testConnection') return okResponse_(testConnection());
    throw new Error('Action GET tidak dikenal: ' + action);
  } catch (err) {
    return errorResponse_(err);
  }
}

function doPost(e) {
  try {
    const raw = e?.postData?.contents || '{}';
    const body = JSON.parse(raw);
    const action = String(body.action || '');
    let result;

    switch (action) {
      case 'addCustomer': result = addCustomer(body); break;
      case 'updateCustomer': result = updateCustomer(body); break;
      case 'updateCustomerStatus': result = updateCustomerStatus(body.rowIndex, body.status); break;
      case 'deleteCustomer': result = deleteCustomer(body.rowIndex); break;
      case 'payBill': result = payBill(body.rowIndex, body.method, body.note); break;
      case 'generateMonthlyBills': result = generateMonthlyBills(body.requestedPeriod); break;
      default: throw new Error('Action POST tidak dikenal: ' + action);
    }

    return okResponse_(result);
  } catch (err) {
    return errorResponse_(err);
  }
}

function getCurrentUser_() {
  try {
    return Session.getActiveUser().getEmail() || 'System';
  } catch (e) {
    return 'System';
  }
}

function getSpreadsheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Spreadsheet tidak ditemukan.');
  return ss;
}

function serializeValue_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone() || 'Asia/Jakarta',
      'yyyy-MM-dd HH:mm:ss'
    );
  }
  return value;
}

function readSheetObjects_(sheetName) {
  const sh = getSpreadsheet_().getSheetByName(sheetName);
  if (!sh) throw new Error('Sheet "' + sheetName + '" tidak ditemukan.');

  const values = sh.getDataRange().getValues();
  if (!values.length) return [];

  const headers = values[0].map(String);

  return values.slice(1)
    .filter(row => row.some(v => v !== '' && v !== null))
    .map((row, idx) => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = serializeValue_(row[i]);
      });
      obj._rowIndex = idx + 2;
      return obj;
    });
}

function getSettings_() {
  const sh = getSpreadsheet_().getSheetByName('Pengaturan');
  if (!sh) return {};

  const values = sh.getDataRange().getValues();
  const output = {};

  values.slice(1).forEach(row => {
    if (row[0]) output[String(row[0])] = String(row[1] ?? '');
  });

  return output;
}

function getInitialData() {
  return {
    pelanggan: readSheetObjects_('Pelanggan'),
    tagihan: readSheetObjects_('Tagihan'),
    pembayaran: readSheetObjects_('Pembayaran'),
    auditLog: readSheetObjects_('Audit_Log'),
    pengaturan: getSettings_()
  };
}

function normalizeWhatsapp_(phone) {
  let value = String(phone || '').replace(/\D/g, '');
  if (!value) return '';

  if (value.startsWith('0')) {
    value = '62' + value.substring(1);
  } else if (value.startsWith('8')) {
    value = '62' + value;
  }

  return value;
}

function generateCustomerId_() {
  const data = readSheetObjects_('Pelanggan');
  let max = 0;

  data.forEach(row => {
    const match = String(row['ID Pelanggan'] || '').match(/WF-(\d+)/i);
    if (match) max = Math.max(max, Number(match[1]));
  });

  return 'WF-' + String(max + 1).padStart(3, '0');
}

function generateBillId_(period) {
  const data = readSheetObjects_('Tagihan');
  let max = 0;

  data.forEach(row => {
    const match = String(row['ID Tagihan'] || '').match(/-(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  });

  return 'INV-' + String(period).replace('-', '') + '-' +
    String(max + 1).padStart(4, '0');
}

function generatePaymentId_() {
  const data = readSheetObjects_('Pembayaran');
  let max = 0;

  data.forEach(row => {
    const match = String(row['ID Pembayaran'] || '').match(/PAY-(\d+)/i);
    if (match) max = Math.max(max, Number(match[1]));
  });

  return 'PAY-' + String(max + 1).padStart(4, '0');
}

function writeAudit_(action, sheetName, reference, description) {
  const sh = getSpreadsheet_().getSheetByName('Audit_Log');
  if (!sh) return;

  sh.appendRow([
    new Date(),
    getCurrentUser_(),
    action || '',
    sheetName || '',
    reference || '',
    description || ''
  ]);
}

function parseDateInput_(value) {
  if (!value) return '';
  if (value instanceof Date) return value;

  const text = String(value);
  const parts = text.split('-').map(Number);

  if (parts.length === 3 && parts.every(n => !isNaN(n))) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  const parsed = new Date(text);
  return isNaN(parsed.getTime()) ? '' : parsed;
}

/* =========================
 * PELANGGAN
 * ========================= */

function addCustomer(data) {
  if (!data || !String(data.nama || '').trim()) {
    throw new Error('Nama pelanggan wajib diisi.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const sh = getSpreadsheet_().getSheetByName('Pelanggan');
    if (!sh) throw new Error('Sheet Pelanggan tidak ditemukan.');

    const id = generateCustomerId_();
    const phone = normalizeWhatsapp_(data.noWhatsApp);

    sh.appendRow([
      id,
      String(data.nama).trim(),
      phone,
      String(data.paketSpeed || '').trim(),
      Number(data.tarifBulanan || 0),
      String(data.alamat || '').trim(),
      parseDateInput_(data.tanggalPasang) || new Date(),
      data.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
      String(data.catatan || '').trim()
    ]);

    writeAudit_(
      'CREATE',
      'Pelanggan',
      id,
      'Menambahkan pelanggan ' + String(data.nama).trim()
    );

    SpreadsheetApp.flush();

    return {
      success: true,
      id: id,
      message: 'Pelanggan berhasil ditambahkan.'
    };
  } finally {
    lock.releaseLock();
  }
}

function updateCustomer(data) {
  if (!data || !data.rowIndex) throw new Error('Baris pelanggan tidak valid.');
  if (!String(data.nama || '').trim()) throw new Error('Nama pelanggan wajib diisi.');

  const sh = getSpreadsheet_().getSheetByName('Pelanggan');
  const row = Number(data.rowIndex);
  if (row < 2 || row > sh.getLastRow()) throw new Error('Baris pelanggan tidak ditemukan.');

  const old = sh.getRange(row, 1, 1, 9).getValues()[0];

  sh.getRange(row, 1, 1, 9).setValues([[
    old[0],
    String(data.nama).trim(),
    normalizeWhatsapp_(data.noWhatsApp),
    String(data.paketSpeed || '').trim(),
    Number(data.tarifBulanan || 0),
    String(data.alamat || '').trim(),
    parseDateInput_(data.tanggalPasang) || old[6] || new Date(),
    data.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
    String(data.catatan || '').trim()
  ]]);

  writeAudit_(
    'UPDATE',
    'Pelanggan',
    old[0],
    'Memperbarui data pelanggan ' + String(data.nama).trim()
  );

  SpreadsheetApp.flush();

  return {
    success: true,
    id: old[0],
    message: 'Data pelanggan berhasil diperbarui.'
  };
}

function updateCustomerStatus(rowIndex, status) {
  const sh = getSpreadsheet_().getSheetByName('Pelanggan');
  const row = Number(rowIndex);

  if (row < 2 || row > sh.getLastRow()) {
    throw new Error('Baris pelanggan tidak ditemukan.');
  }

  const finalStatus = status === 'Aktif' ? 'Aktif' : 'Nonaktif';
  const id = sh.getRange(row, 1).getValue();

  sh.getRange(row, 8).setValue(finalStatus);

  writeAudit_(
    'STATUS',
    'Pelanggan',
    id,
    'Status pelanggan diubah menjadi ' + finalStatus
  );

  SpreadsheetApp.flush();

  return { success: true, message: 'Status pelanggan diperbarui.' };
}

function deleteCustomer(rowIndex) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const sh = getSpreadsheet_().getSheetByName('Pelanggan');
    const row = Number(rowIndex);

    if (row < 2 || row > sh.getLastRow()) {
      throw new Error('Baris pelanggan tidak ditemukan.');
    }

    const values = sh.getRange(row, 1, 1, 9).getValues()[0];
    const id = String(values[0] || '');
    const name = String(values[1] || '');

    if (!id) throw new Error('ID pelanggan tidak valid.');

    // Hapus hanya master pelanggan.
    // Tagihan dan pembayaran TIDAK dihapus agar histori keuangan tetap aman.
    sh.deleteRow(row);

    writeAudit_(
      'DELETE',
      'Pelanggan',
      id,
      'Menghapus pelanggan ' + name + '. Histori tagihan/pembayaran dipertahankan.'
    );

    SpreadsheetApp.flush();

    return {
      success: true,
      message: 'Pelanggan ' + name + ' berhasil dihapus. Histori tagihan dan pembayaran tetap tersimpan.'
    };
  } finally {
    lock.releaseLock();
  }
}

/* =========================
 * PEMBAYARAN
 * ========================= */

function payBill(rowIndex, method, note) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const ss = getSpreadsheet_();
    const bill = ss.getSheetByName('Tagihan');
    const payment = ss.getSheetByName('Pembayaran');

    const row = Number(rowIndex);
    if (row < 2 || row > bill.getLastRow()) {
      throw new Error('Tagihan tidak ditemukan.');
    }

    const values = bill.getRange(row, 1, 1, 9).getValues()[0];

    if (String(values[6]) === 'Lunas') {
      throw new Error('Tagihan ini sudah lunas.');
    }

    const now = new Date();
    const selectedMethod = String(method || 'Tunai');

    bill.getRange(row, 7, 1, 3).setValues([[
      'Lunas',
      now,
      selectedMethod
    ]]);

    const payId = generatePaymentId_();

    payment.appendRow([
      payId,
      values[0],
      values[1],
      values[2],
      values[3],
      values[5],
      now,
      selectedMethod,
      getCurrentUser_(),
      String(note || '')
    ]);

    writeAudit_(
      'PAYMENT',
      'Tagihan',
      values[0],
      'Pembayaran dicatat sebesar ' + values[5]
    );

    SpreadsheetApp.flush();

    return {
      success: true,
      paymentId: payId,
      message: 'Pembayaran berhasil dicatat.'
    };
  } finally {
    lock.releaseLock();
  }
}

/* =========================
 * GENERATE TAGIHAN
 * ========================= */

function generateMonthlyBills(requestedPeriod) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const ss = getSpreadsheet_();
    const customers = readSheetObjects_('Pelanggan')
      .filter(x => String(x['Status']) === 'Aktif');

    const bills = readSheetObjects_('Tagihan');
    const settings = getSettings_();

    const period = requestedPeriod ||
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone() || 'Asia/Jakarta',
        'yyyy-MM'
      );

    if (!/^\d{4}-\d{2}$/.test(period)) {
      throw new Error('Format periode harus YYYY-MM.');
    }

    const existing = {};
    bills.forEach(b => {
      existing[String(b['ID Pelanggan']) + '|' + String(b['Periode'])] = true;
    });

    const sh = ss.getSheetByName('Tagihan');
    const dueDay = Math.min(
      Math.max(Number(settings['JATUH_TEMPO'] || 5), 1),
      28
    );

    const year = Number(period.substring(0, 4));
    const month = Number(period.substring(5, 7));

    if (month < 1 || month > 12) throw new Error('Periode bulan tidak valid.');

    const due = new Date(year, month - 1, dueDay);
    const rows = [];
    let sequence = bills.length + 1;

    customers.forEach(customer => {
      const key = String(customer['ID Pelanggan']) + '|' + period;
      if (existing[key]) return;

      rows.push([
        'INV-' + period.replace('-', '') + '-' +
          String(sequence++).padStart(4, '0'),
        customer['ID Pelanggan'],
        customer['Nama Pelanggan'],
        period,
        due,
        Number(customer['Tarif Bulanan'] || 0),
        'Belum Bayar',
        '',
        ''
      ]);
    });

    if (rows.length) {
      sh.getRange(sh.getLastRow() + 1, 1, rows.length, 9).setValues(rows);
    }

    writeAudit_(
      'GENERATE',
      'Tagihan',
      period,
      'Membuat ' + rows.length + ' tagihan periode ' + period
    );

    SpreadsheetApp.flush();

    return {
      success: true,
      created: rows.length,
      message: rows.length + ' tagihan baru dibuat untuk periode ' + period + '.'
    };
  } finally {
    lock.releaseLock();
  }
}

function testConnection() {
  return 'Code.gs berhasil dihubungi dari Web App.';
}
