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
    if (action === 'auditDatabase') return okResponse_(auditDatabase());
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
      case 'repairDatabase': result = repairDatabase(); break;
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

function getUsedCustomerIds_() {
  const used = {};

  ['Pelanggan', 'Pelanggan_Arsip', 'Tagihan', 'Pembayaran'].forEach(sheetName => {
    const sh = getSpreadsheet_().getSheetByName(sheetName);
    if (!sh) return;

    const values = sh.getDataRange().getValues();
    if (!values.length) return;

    const headers = values[0].map(String);
    const idIndex = headers.indexOf('ID Pelanggan');
    if (idIndex < 0) return;

    values.slice(1).forEach(row => {
      const id = String(row[idIndex] || '').trim();
      if (id) used[id] = true;
    });
  });

  const audit = getSpreadsheet_().getSheetByName('Audit_Log');
  if (audit) {
    const values = audit.getDataRange().getValues();
    values.slice(1).forEach(row => {
      const ref = String(row[4] || '').trim();
      if (/^WF-\d+$/i.test(ref)) used[ref] = true;
    });
  }

  return used;
}

function generateCustomerId_() {
  const used = getUsedCustomerIds_();
  let max = 0;

  Object.keys(used).forEach(id => {
    const match = String(id).match(/^WF-(\d+)$/i);
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

function periodKey_(value) {
  if (!value) return '';

  if (value instanceof Date) {
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone() || 'Asia/Jakarta',
      'yyyy-MM'
    );
  }

  const text = String(value).trim();
  const match = text.match(/^(\d{4})-(\d{2})/);

  return match ? match[1] + '-' + match[2] : text;
}

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
      existing[String(b['ID Pelanggan']) + '|' + periodKey_(b['Periode'])] = true;
    });

    const sh = ss.getSheetByName('Tagihan');
    const dueDay = Math.min(
      Math.max(Number(settings['JATUH_TEMPO'] || 5), 1),
      28
    );

    const year = Number(period.substring(0, 4));
    const month = Number(period.substring(5, 7));

    if (month < 1 || month > 12) {
      throw new Error('Periode bulan tidak valid.');
    }

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

/* =========================
 * DATABASE AUDIT & REPAIR
 * ========================= */

function auditDatabase() {
  const customers = readSheetObjects_('Pelanggan');
  const bills = readSheetObjects_('Tagihan');
  const payments = readSheetObjects_('Pembayaran');

  const customerMap = {};
  customers.forEach(c => {
    customerMap[String(c['ID Pelanggan'])] = c;
  });

  const collisionBills = [];
  const groups = {};

  bills.forEach(b => {
    const id = String(b['ID Pelanggan'] || '');
    const name = String(b['Nama'] || '').trim();
    const customer = customerMap[id];
    const currentName = customer
      ? String(customer['Nama Pelanggan'] || '').trim()
      : '';

    if (customer && name && currentName && name !== currentName) {
      collisionBills.push({
        rowIndex: b._rowIndex,
        billId: b['ID Tagihan'],
        customerId: id,
        historicalName: name,
        currentName: currentName,
        period: periodKey_(b['Periode'])
      });
    }

    if (customer && name === currentName) {
      const key =
        id + '|' +
        periodKey_(b['Periode']) + '|' +
        name.toLowerCase();

      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    }
  });

  const duplicateGroups = Object.keys(groups)
    .map(key => ({
      key: key,
      bills: groups[key]
    }))
    .filter(g => g.bills.length > 1)
    .map(g => ({
      key: g.key,
      rows: g.bills.map(b => ({
        rowIndex: b._rowIndex,
        billId: b['ID Tagihan'],
        status: b['Status'],
        period: periodKey_(b['Periode'])
      }))
    }));

  const paymentBillIds = {};

  payments.forEach(p => {
    const billId = String(p['ID Tagihan'] || '');
    if (billId) {
      paymentBillIds[billId] =
        (paymentBillIds[billId] || 0) + 1;
    }
  });

  duplicateGroups.forEach(g => {
    g.rows.forEach(r => {
      r.paymentCount =
        paymentBillIds[String(r.billId)] || 0;
    });
  });

  return {
    safe: true,
    customerCount: customers.length,
    billCount: bills.length,
    paymentCount: payments.length,
    collisionCount: collisionBills.length,
    duplicateGroupCount: duplicateGroups.length,
    historicalCollisions: collisionBills,
    duplicateGroups: duplicateGroups
  };
}

function repairDatabase() {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const ss = getSpreadsheet_();
    const customerSheet = ss.getSheetByName('Pelanggan');
    const billSheet = ss.getSheetByName('Tagihan');
    const paymentSheet = ss.getSheetByName('Pembayaran');

    if (!customerSheet || !billSheet || !paymentSheet) {
      throw new Error('Sheet utama database tidak lengkap.');
    }

    const customers = readSheetObjects_('Pelanggan');
    const bills = readSheetObjects_('Tagihan');
    const payments = readSheetObjects_('Pembayaran');

    const customerMap = {};
    customers.forEach(c => {
      customerMap[String(c['ID Pelanggan'])] = c;
    });

    /*
     * 1. Arsipkan histori yang ID-nya collision dengan pelanggan aktif.
     *
     * Tagihan menyimpan snapshot Nama pelanggan. Jika nama pada tagihan
     * berbeda dengan master pelanggan saat ini, berarti record tersebut
     * merupakan histori dari pemilik ID sebelumnya.
     */
    let archiveSheet = ss.getSheetByName('Pelanggan_Arsip');

    if (!archiveSheet) {
      archiveSheet = ss.insertSheet('Pelanggan_Arsip');

      archiveSheet.getRange(1, 1, 1, 10).setValues([[
        'ID Arsip',
        'ID Pelanggan Lama',
        'Nama Pelanggan',
        'No WhatsApp',
        'Paket Speed',
        'Tarif Bulanan',
        'Alamat',
        'Tanggal Pasang',
        'Status',
        'Catatan'
      ]]);

      archiveSheet.setFrozenRows(1);
    }

    const archiveValues = archiveSheet.getDataRange().getValues();
    const archiveNames = {};

    archiveValues.slice(1).forEach(r => {
      archiveNames[
        String(r[1] || '') + '|' +
        String(r[2] || '').toLowerCase()
      ] = true;
    });

    const rowsToArchive = [];
    const historicalBillRows = [];

    bills.forEach(b => {
      const id = String(b['ID Pelanggan'] || '');
      const name = String(b['Nama'] || '').trim();
      const current = customerMap[id];

      const currentName = current
        ? String(current['Nama Pelanggan'] || '').trim()
        : '';

      if (!current || !name || !currentName || name === currentName) {
        return;
      }

      const archiveId = 'HIST-' + id;
      const key = id + '|' + name.toLowerCase();

      if (!archiveNames[key]) {
        rowsToArchive.push([
          archiveId,
          id,
          name,
          '',
          '',
          Number(b['Nominal'] || 0),
          '',
          '',
          'Arsip',
          'Dipulihkan dari histori tagihan ' +
            String(b['ID Tagihan'] || '')
        ]);

        archiveNames[key] = true;
      }

      historicalBillRows.push({
        rowIndex: b._rowIndex,
        oldId: id,
        newId: archiveId,
        billId: String(b['ID Tagihan'] || '')
      });
    });

    if (rowsToArchive.length) {
      archiveSheet
        .getRange(
          archiveSheet.getLastRow() + 1,
          1,
          rowsToArchive.length,
          10
        )
        .setValues(rowsToArchive);
    }

    historicalBillRows.forEach(item => {
      billSheet
        .getRange(Number(item.rowIndex), 2)
        .setValue(item.newId);

      writeAudit_(
        'REPAIR_ARCHIVE',
        'Tagihan',
        item.billId,
        'Memindahkan histori ' +
          item.oldId +
          ' ke ' +
          item.newId
      );
    });

    /*
     * 2. Re-read setelah histori dipisahkan.
     */
    const repairedBills = readSheetObjects_('Tagihan');
    const repairedPayments = readSheetObjects_('Pembayaran');

    const paymentCountByBill = {};

    repairedPayments.forEach(p => {
      const id = String(p['ID Tagihan'] || '');

      if (id) {
        paymentCountByBill[id] =
          (paymentCountByBill[id] || 0) + 1;
      }
    });

    /*
     * 3. Cari duplicate operasional.
     *
     * Prioritas record yang dipertahankan:
     *   a. Lunas
     *   b. jika sama-sama belum bayar → row paling awal
     *
     * Record yang memiliki pembayaran tidak akan dihapus otomatis.
     */
    const groups = {};

    repairedBills.forEach(b => {
      const id = String(b['ID Pelanggan'] || '');
      const customer = customerMap[id];

      if (!customer) return;

      const name = String(b['Nama'] || '').trim();
      const currentName =
        String(customer['Nama Pelanggan'] || '').trim();

      if (!name || name !== currentName) return;

      const key =
        id + '|' +
        periodKey_(b['Periode']) + '|' +
        name.toLowerCase();

      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });

    const deleteRows = [];
    const unresolved = [];

    Object.keys(groups).forEach(key => {
      const list = groups[key];

      if (list.length <= 1) return;

      const paid = list.filter(
        b => String(b['Status']) === 'Lunas'
      );

      const candidates = paid.length ? paid : list;

      candidates.sort(
        (a, b) =>
          Number(a._rowIndex) - Number(b._rowIndex)
      );

      const keep = candidates[0];

      list.forEach(b => {
        if (
          Number(b._rowIndex) ===
          Number(keep._rowIndex)
        ) {
          return;
        }

        const count =
          paymentCountByBill[
            String(b['ID Tagihan'])
          ] || 0;

        if (count > 0) {
          unresolved.push({
            rowIndex: b._rowIndex,
            billId: b['ID Tagihan'],
            paymentCount: count,
            reason:
              'Memiliki pembayaran; tidak dihapus otomatis.'
          });
        } else {
          deleteRows.push({
            rowIndex: b._rowIndex,
            billId: b['ID Tagihan'],
            keepBillId: keep['ID Tagihan']
          });
        }
      });
    });

    /*
     * Hapus dari bawah ke atas agar rowIndex tidak bergeser.
     */
    deleteRows.sort(
      (a, b) =>
        Number(b.rowIndex) -
        Number(a.rowIndex)
    );

    deleteRows.forEach(item => {
      billSheet.deleteRow(Number(item.rowIndex));

      writeAudit_(
        'REPAIR_DELETE_DUPLICATE',
        'Tagihan',
        item.billId,
        'Menghapus duplicate; mempertahankan ' +
          item.keepBillId
      );
    });

    SpreadsheetApp.flush();

    const result = auditDatabase();

    return {
      success: true,
      archivedHistoricalBills:
        historicalBillRows.length,
      deletedDuplicateBills:
        deleteRows.length,
      unresolvedDuplicates:
        unresolved,
      finalAudit:
        result,
      message:
        'Database repair selesai. Histori collision diarsipkan dan duplicate tanpa pembayaran dibersihkan.'
    };
  } finally {
    lock.releaseLock();
  }
}

function testConnection() {
  return 'Code.gs berhasil dihubungi dari Web App.';
}
