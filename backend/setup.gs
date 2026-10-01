/**
 * ============================================================
 * NUSANTARA WIFI V5 — DATABASE SETUP
 * ============================================================
 * Jalankan setupDatabase() SATU KALI setelah memasang semua file.
 *
 * PERINGATAN:
 * setupDatabase() akan mengosongkan dan membuat ulang isi sheet
 * aplikasi. Jangan jalankan lagi setelah data produksi dimasukkan.
 * ============================================================
 */

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Spreadsheet tidak ditemukan.');

  const now = new Date();
  const tz = Session.getScriptTimeZone() || 'Asia/Jakarta';
  const period = Utilities.formatDate(now, tz, 'yyyy-MM');

  const pelangganHeaders = [
    'ID Pelanggan','Nama Pelanggan','No WhatsApp','Paket Speed',
    'Tarif Bulanan','Alamat','Tanggal Pasang','Status','Catatan'
  ];

  const tagihanHeaders = [
    'ID Tagihan','ID Pelanggan','Nama','Periode','Jatuh Tempo',
    'Nominal','Status','Tgl Bayar','Metode'
  ];

  const pembayaranHeaders = [
    'ID Pembayaran','ID Tagihan','ID Pelanggan','Nama Pelanggan',
    'Periode','Nominal','Tanggal Bayar','Metode','Petugas','Catatan'
  ];

  const auditHeaders = [
    'Timestamp','User','Action','Sheet','Reference','Description'
  ];

  const pengaturanHeaders = ['Parameter','Nilai'];

  const settings = [
    ['NAMA_BISNIS','Nusantara WiFi'],
    ['NAMA_PENGELOLA','Nusantara Building Material'],
    ['NO_REKENING',''],
    ['BANK',''],
    ['E_WALLET',''],
    ['JATUH_TEMPO','5'],
    ['ALAMAT','Surorejan, Puring, Kebumen'],
    ['NO_KONTAK','']
  ];

  // Data contoh hanya untuk memastikan UI langsung bisa diuji.
  // Setelah aplikasi siap produksi, hapus contoh ini dari Sheet.
  const pelangganData = [
    ['WF-001','Budi Santoso','081234567890','10 Mbps',150000,'Surorejan',now,'Aktif','Contoh data'],
    ['WF-002','Siti Aminah','081234567891','15 Mbps',175000,'Puring',now,'Aktif',''],
    ['WF-003','Andi Pratama','081234567892','20 Mbps',200000,'Surorejan',now,'Aktif','']
  ];

  const dueDay = Number(settings.find(x => x[0] === 'JATUH_TEMPO')[1]) || 5;
  const due = new Date(now.getFullYear(), now.getMonth(), dueDay);

  const tagihanData = pelangganData.map((p, i) => [
    'INV-' + period.replace('-', '') + '-' + String(i + 1).padStart(3, '0'),
    p[0], p[1], period, due, p[4], 'Belum Bayar', '', ''
  ]);

  const pelanggan = createOrResetSheet_('Pelanggan', pelangganHeaders, pelangganData);
  const tagihan = createOrResetSheet_('Tagihan', tagihanHeaders, tagihanData);
  const pembayaran = createOrResetSheet_('Pembayaran', pembayaranHeaders, []);
  const audit = createOrResetSheet_('Audit_Log', auditHeaders, []);
  const pengaturan = createOrResetSheet_('Pengaturan', pengaturanHeaders, settings);

  setupDataValidation_(pelanggan, tagihan);
  formatDatabaseSheets_(pelanggan, tagihan, pembayaran, audit, pengaturan);

  audit.appendRow([
    new Date(), getCurrentUser_(), 'SETUP', 'SYSTEM', '',
    'Database Nusantara WiFi V5 berhasil dibuat/reset.'
  ]);

  SpreadsheetApp.flush();

  return {
    success: true,
    message: 'Database Nusantara WiFi V5 berhasil dibuat.'
  };
}

function createOrResetSheet_(name, headers, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);

  const filter = sh.getFilter();
  if (filter) filter.remove();

  sh.clearContents();
  sh.clearFormats();
  sh.setConditionalFormatRules([]);

  const rows = sh.getMaxRows();
  const cols = sh.getMaxColumns();
  if (rows > 0 && cols > 0) {
    sh.getRange(1, 1, rows, cols).clearDataValidations();
  }

  sh.getRange(1, 1, 1, headers.length).setValues([headers]);

  if (data && data.length) {
    sh.getRange(2, 1, data.length, headers.length).setValues(data);
  }

  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#EAF0F7')
    .setFontColor('#26364A');

  sh.autoResizeColumns(1, headers.length);
  return sh;
}

function setupDataValidation_(pelanggan, tagihan) {
  const maxP = Math.max(pelanggan.getMaxRows() - 1, 1);
  const maxT = Math.max(tagihan.getMaxRows() - 1, 1);

  const customerStatus = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Aktif', 'Nonaktif'], true)
    .setAllowInvalid(false)
    .build();

  const billStatus = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Belum Bayar', 'Lunas'], true)
    .setAllowInvalid(false)
    .build();

  const paymentMethod = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Tunai', 'Transfer Bank', 'E-Wallet', 'Lainnya'], true)
    .setAllowInvalid(true)
    .build();

  pelanggan.getRange(2, 8, maxP, 1).setDataValidation(customerStatus);
  tagihan.getRange(2, 7, maxT, 1).setDataValidation(billStatus);
  tagihan.getRange(2, 9, maxT, 1).setDataValidation(paymentMethod);
}

function formatDatabaseSheets_(pelanggan, tagihan, pembayaran, audit, pengaturan) {
  const rowsP = Math.max(pelanggan.getMaxRows() - 1, 1);
  const rowsT = Math.max(tagihan.getMaxRows() - 1, 1);
  const rowsPay = Math.max(pembayaran.getMaxRows() - 1, 1);

  pelanggan.getRange(2, 5, rowsP, 1).setNumberFormat('#,##0');
  pelanggan.getRange(2, 7, rowsP, 1).setNumberFormat('dd/MM/yyyy');

  tagihan.getRange(2, 5, rowsT, 1).setNumberFormat('dd/MM/yyyy');
  tagihan.getRange(2, 6, rowsT, 1).setNumberFormat('#,##0');
  tagihan.getRange(2, 8, rowsT, 1).setNumberFormat('dd/MM/yyyy HH:mm');

  pembayaran.getRange(2, 6, rowsPay, 1).setNumberFormat('#,##0');
  pembayaran.getRange(2, 7, rowsPay, 1).setNumberFormat('dd/MM/yyyy HH:mm');

  [pelanggan, tagihan, pembayaran, audit, pengaturan].forEach(sh => {
    sh.getRange(1, 1, 1, sh.getLastColumn())
      .setVerticalAlignment('middle');
  });
}

function getCurrentUser_() {
  try {
    return Session.getActiveUser().getEmail() || 'User';
  } catch (e) {
    return 'User';
  }
}
