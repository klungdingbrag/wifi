/* ============================================================
 * NUSANTARA WIFI V6.3 — HARDENED BACKEND
 * ============================================================ */

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
function okResponse_(data) { return jsonResponse_({ success:true, data:data }); }
function errorResponse_(err) { return jsonResponse_({ success:false, message:err && err.message ? err.message : String(err) }); }

function doGet(e) {
  try {
    const action = String(e?.parameter?.action || 'getInitialData');
    if (action === 'getInitialData') return okResponse_(getInitialData());
    if (action === 'testConnection') return okResponse_(testConnection());
    if (action === 'auditDatabase') return okResponse_(auditDatabase());
    throw new Error('Action GET tidak dikenal: ' + action);
  } catch (err) { return errorResponse_(err); }
}

function doPost(e) {
  try {
    const body = JSON.parse(e?.postData?.contents || '{}');
    const action = String(body.action || '');
    let result;
    switch (action) {
      case 'addCustomer': result = addCustomer(body); break;
      case 'updateCustomer': result = updateCustomer(body); break;
      case 'updateCustomerStatus': result = updateCustomerStatus(body.rowIndex, body.status, body.customerId); break;
      case 'deleteCustomer': result = deleteCustomer(body.rowIndex, body.customerId); break;
      case 'payBill': result = payBill(body.rowIndex, body.method, body.note, body.billId); break;
      case 'generateMonthlyBills': result = generateMonthlyBills(body.requestedPeriod); break;
      case 'repairDatabase': result = repairDatabase(); break;
      default: throw new Error('Action POST tidak dikenal: ' + action);
    }
    return okResponse_(result);
  } catch (err) { return errorResponse_(err); }
}

function getCurrentUser_() {
  try { return Session.getActiveUser().getEmail() || 'System'; } catch (e) { return 'System'; }
}
function getSpreadsheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Spreadsheet tidak ditemukan.');
  return ss;
}
function serializeValue_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
  return value;
}
function readSheetObjects_(sheetName) {
  const sh = getSpreadsheet_().getSheetByName(sheetName);
  if (!sh) throw new Error('Sheet "' + sheetName + '" tidak ditemukan.');
  const values = sh.getDataRange().getValues();
  if (!values.length) return [];
  const headers = values[0].map(String);
  return values.slice(1).filter(row => row.some(v => v !== '' && v !== null)).map((row, idx) => {
    const obj = {};
    headers.forEach((header,i) => obj[header] = serializeValue_(row[i]));
    obj._rowIndex = idx + 2;
    return obj;
  });
}
function getSettings_() {
  const sh = getSpreadsheet_().getSheetByName('Pengaturan');
  if (!sh) return {};
  const values = sh.getDataRange().getValues(); const output = {};
  values.slice(1).forEach(row => { if (row[0]) output[String(row[0])] = String(row[1] ?? ''); });
  return output;
}
function getInitialData() {
  return { pelanggan:readSheetObjects_('Pelanggan'), tagihan:readSheetObjects_('Tagihan'), pembayaran:readSheetObjects_('Pembayaran'), auditLog:readSheetObjects_('Audit_Log'), pengaturan:getSettings_() };
}
function normalizeWhatsapp_(phone) {
  let value = String(phone || '').replace(/\D/g,'');
  if (!value) return '';
  if (value.startsWith('0')) value = '62' + value.substring(1);
  else if (value.startsWith('8')) value = '62' + value;
  return value;
}
function getUsedCustomerIds_() {
  const used = {};
  ['Pelanggan','Pelanggan_Arsip','Tagihan','Pembayaran'].forEach(sheetName => {
    const sh = getSpreadsheet_().getSheetByName(sheetName); if (!sh) return;
    const values = sh.getDataRange().getValues(); if (!values.length) return;
    const headers = values[0].map(String), idIndex = headers.indexOf('ID Pelanggan'), oldIdIndex = headers.indexOf('ID Pelanggan Lama');
    values.slice(1).forEach(row => { const id=idIndex>=0?String(row[idIndex]||'').trim():''; const oldId=oldIdIndex>=0?String(row[oldIdIndex]||'').trim():''; if(id)used[id]=true; if(oldId)used[oldId]=true; });
  });
  const audit=getSpreadsheet_().getSheetByName('Audit_Log');
  if(audit){ const values=audit.getDataRange().getValues(); values.slice(1).forEach(row=>{const ref=String(row[4]||'').trim();if(/^WF-\d+$/i.test(ref))used[ref]=true;}); }
  return used;
}
function generateCustomerId_() {
  const used=getUsedCustomerIds_(); let max=0;
  Object.keys(used).forEach(id=>{const m=String(id).match(/^WF-(\d+)$/i);if(m)max=Math.max(max,Number(m[1]));});
  return 'WF-'+String(max+1).padStart(3,'0');
}
function getUsedBillIds_() {
  const used={}; const sh=getSpreadsheet_().getSheetByName('Tagihan'); if(!sh)throw new Error('Sheet Tagihan tidak ditemukan.');
  const values=sh.getDataRange().getValues(); if(!values.length)return used; const headers=values[0].map(String), idx=headers.indexOf('ID Tagihan'); if(idx<0)throw new Error('Kolom ID Tagihan tidak ditemukan.');
  values.slice(1).forEach(row=>{const id=String(row[idx]||'').trim();if(id)used[id]=true;}); return used;
}
function generateBillId_(period,usedIds) {
  if(!/^\d{4}-\d{2}$/.test(String(period)))throw new Error('Format periode invoice tidak valid.');
  const used=usedIds||getUsedBillIds_(),prefix='INV-'+String(period).replace('-','')+'-'; let max=0;
  Object.keys(used).forEach(id=>{if(!String(id).startsWith(prefix))return;const m=String(id).match(/-(\d+)$/);if(m)max=Math.max(max,Number(m[1]));});
  let seq=max+1,candidate=prefix+String(seq).padStart(4,'0'); while(used[candidate]){seq++;candidate=prefix+String(seq).padStart(4,'0');} return candidate;
}
function generatePaymentId_(){
  const data=readSheetObjects_('Pembayaran'); let max=0;
  data.forEach(row=>{const m=String(row['ID Pembayaran']||'').match(/PAY-(\d+)/i);if(m)max=Math.max(max,Number(m[1]));});
  return 'PAY-'+String(max+1).padStart(4,'0');
}
function getPaymentForBill_(billId){return readSheetObjects_('Pembayaran').filter(p=>String(p['ID Tagihan']||'')===String(billId));}
function writeAudit_(action,sheetName,reference,description){const sh=getSpreadsheet_().getSheetByName('Audit_Log');if(sh)sh.appendRow([new Date(),getCurrentUser_(),action||'',sheetName||'',reference||'',description||'']);}
function parseDateInput_(value){if(!value)return '';if(value instanceof Date)return value;const text=String(value),parts=text.split('-').map(Number);if(parts.length===3&&parts.every(n=>!isNaN(n)))return new Date(parts[0],parts[1]-1,parts[2]);const parsed=new Date(text);return isNaN(parsed.getTime())?'':parsed;}

function addCustomer(data){
  if(!data||!String(data.nama||'').trim())throw new Error('Nama pelanggan wajib diisi.');
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{const sh=getSpreadsheet_().getSheetByName('Pelanggan');if(!sh)throw new Error('Sheet Pelanggan tidak ditemukan.');const id=generateCustomerId_();sh.appendRow([id,String(data.nama).trim(),normalizeWhatsapp_(data.noWhatsApp),String(data.paketSpeed||'').trim(),Number(data.tarifBulanan||0),String(data.alamat||'').trim(),parseDateInput_(data.tanggalPasang)||new Date(),data.status==='Nonaktif'?'Nonaktif':'Aktif',String(data.catatan||'').trim()]);writeAudit_('CREATE','Pelanggan',id,'Menambahkan pelanggan '+String(data.nama).trim());SpreadsheetApp.flush();return{success:true,id:id,message:'Pelanggan berhasil ditambahkan.'};}finally{lock.releaseLock();}
}

function findCustomerRowById_(customerId){
  const id=String(customerId||'').trim(); if(!id)return 0;
  const sh=getSpreadsheet_().getSheetByName('Pelanggan'); if(!sh)return 0;
  const values=sh.getDataRange().getValues(); if(values.length<2)return 0;
  const headers=values[0].map(String), idx=headers.indexOf('ID Pelanggan'); if(idx<0)return 0;
  for(let i=1;i<values.length;i++)if(String(values[i][idx]||'').trim()===id)return i+1;
  return 0;
}
function findBillRowById_(billId){
  const id=String(billId||'').trim(); if(!id)return 0;
  const sh=getSpreadsheet_().getSheetByName('Tagihan'); if(!sh)return 0;
  const values=sh.getDataRange().getValues(); if(values.length<2)return 0;
  const headers=values[0].map(String), idx=headers.indexOf('ID Tagihan'); if(idx<0)return 0;
  for(let i=1;i<values.length;i++)if(String(values[i][idx]||'').trim()===id)return i+1;
  return 0;
}

function updateCustomer(data){
  if(!data||!String(data.nama||'').trim())throw new Error('Nama pelanggan wajib diisi.');
  const sh=getSpreadsheet_().getSheetByName('Pelanggan'); if(!sh)throw new Error('Sheet Pelanggan tidak ditemukan.');
  let row=data.customerId?findCustomerRowById_(data.customerId):Number(data.rowIndex);
  if(row<2||row>sh.getLastRow())throw new Error('Pelanggan tidak ditemukan.');
  const old=sh.getRange(row,1,1,9).getValues()[0];
  if(data.customerId&&String(old[0])!==String(data.customerId))throw new Error('ID pelanggan tidak cocok.');
  sh.getRange(row,1,1,9).setValues([[old[0],String(data.nama).trim(),normalizeWhatsapp_(data.noWhatsApp),String(data.paketSpeed||'').trim(),Number(data.tarifBulanan||0),String(data.alamat||'').trim(),parseDateInput_(data.tanggalPasang)||old[6]||new Date(),data.status==='Nonaktif'?'Nonaktif':'Aktif',String(data.catatan||'').trim()]]);
  writeAudit_('UPDATE','Pelanggan',old[0],'Memperbarui data pelanggan '+String(data.nama).trim());SpreadsheetApp.flush();return{success:true,id:old[0],message:'Data pelanggan berhasil diperbarui.'};
}
function updateCustomerStatus(rowIndex,status,customerId){
  const sh=getSpreadsheet_().getSheetByName('Pelanggan'); if(!sh)throw new Error('Sheet Pelanggan tidak ditemukan.');
  const row=customerId?findCustomerRowById_(customerId):Number(rowIndex);if(row<2||row>sh.getLastRow())throw new Error('Pelanggan tidak ditemukan.');
  const id=String(sh.getRange(row,1).getValue()||'');if(customerId&&id!==String(customerId))throw new Error('ID pelanggan tidak cocok.');
  const finalStatus=status==='Aktif'?'Aktif':'Nonaktif';sh.getRange(row,8).setValue(finalStatus);writeAudit_('STATUS','Pelanggan',id,'Status pelanggan diubah menjadi '+finalStatus);SpreadsheetApp.flush();return{success:true,message:'Status pelanggan diperbarui.'};
}
function deleteCustomer(rowIndex,customerId){
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{const sh=getSpreadsheet_().getSheetByName('Pelanggan');if(!sh)throw new Error('Sheet Pelanggan tidak ditemukan.');const row=customerId?findCustomerRowById_(customerId):Number(rowIndex);if(row<2||row>sh.getLastRow())throw new Error('Pelanggan tidak ditemukan.');const values=sh.getRange(row,1,1,9).getValues()[0];const id=String(values[0]||''),name=String(values[1]||'');if(customerId&&id!==String(customerId))throw new Error('ID pelanggan tidak cocok.');if(!id)throw new Error('ID pelanggan tidak valid.');sh.deleteRow(row);writeAudit_('DELETE','Pelanggan',id,'Menghapus pelanggan '+name+'. Histori tagihan/pembayaran dipertahankan.');SpreadsheetApp.flush();return{success:true,message:'Pelanggan '+name+' berhasil dihapus. Histori tagihan dan pembayaran tetap tersimpan.'};}finally{lock.releaseLock();}
}

function payBill(rowIndex,method,note,billId){
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const ss=getSpreadsheet_(),bill=ss.getSheetByName('Tagihan'),payment=ss.getSheetByName('Pembayaran');if(!bill||!payment)throw new Error('Sheet pembayaran/tagihan tidak ditemukan.');
    const row=billId?findBillRowById_(billId):Number(rowIndex);if(!Number.isInteger(row)||row<2||row>bill.getLastRow())throw new Error('Tagihan tidak ditemukan.');
    const values=bill.getRange(row,1,1,9).getValues()[0],actualBillId=String(values[0]||'').trim();if(billId&&actualBillId!==String(billId))throw new Error('ID tagihan tidak cocok.');
    const customerId=String(values[1]||'').trim(),customerName=String(values[2]||'').trim(),nominal=Number(values[5]);
    if(!actualBillId||!customerId||!customerName||!Number.isFinite(nominal)||nominal<=0)throw new Error('Data tagihan tidak valid.');
    if(String(values[6])==='Lunas')throw new Error('Tagihan ini sudah lunas.');
    if(getPaymentForBill_(actualBillId).length>0)throw new Error('Tagihan ini sudah memiliki pembayaran. Pembayaran ganda ditolak.');
    const customerSheet=ss.getSheetByName('Pelanggan');if(!customerSheet)throw new Error('Sheet Pelanggan tidak ditemukan.');
    const cv=customerSheet.getDataRange().getValues(),ch=cv[0].map(String),cid=ch.indexOf('ID Pelanggan');if(cid<0)throw new Error('Kolom ID Pelanggan pada Pelanggan tidak ditemukan.');
    if(!cv.slice(1).some(r=>String(r[cid]||'').trim()===customerId))throw new Error('Pelanggan untuk tagihan ini tidak ditemukan pada master pelanggan.');
    const selectedMethod=String(method||'Tunai').trim()||'Tunai',now=new Date(),payId=generatePaymentId_();
    const ph=payment.getRange(1,1,1,payment.getLastColumn()).getValues()[0].map(String),pid=ph.indexOf('ID Pembayaran');
    if(pid>=0&&payment.getDataRange().getValues().slice(1).some(r=>String(r[pid]||'').trim()===payId))throw new Error('ID pembayaran bentrok. Silakan ulangi transaksi.');

    // Schema Pembayaran V5: ID Pembayaran, ID Tagihan, ID Pelanggan, Nama Pelanggan, Periode, Nominal, Tanggal Bayar, Metode, Petugas, Catatan
    const paymentRow=[payId,actualBillId,customerId,customerName,values[3],nominal,now,selectedMethod,getCurrentUser_(),String(note||'')];
    const paymentRowNumber=payment.getLastRow()+1;
    let paymentWritten=false;
    try{
      payment.getRange(paymentRowNumber,1,1,paymentRow.length).setValues([paymentRow]);
      SpreadsheetApp.flush();paymentWritten=true;
      bill.getRange(row,7,1,3).setValues([['Lunas',now,selectedMethod]]);SpreadsheetApp.flush();
    }catch(txErr){
      if(paymentWritten){try{payment.deleteRow(paymentRowNumber);SpreadsheetApp.flush();}catch(rollbackErr){writeAudit_('ROLLBACK_ERROR','Pembayaran',payId,'Gagal rollback pembayaran setelah transaksi gagal: '+rollbackErr.message);}}
      throw txErr;
    }
    writeAudit_('PAYMENT','Tagihan',actualBillId,'Pembayaran dicatat sebesar '+nominal+' dengan ID '+payId);SpreadsheetApp.flush();
    return{success:true,paymentId:payId,message:'Pembayaran berhasil dicatat.'};
  }finally{lock.releaseLock();}
}

function periodKey_(value){if(!value)return '';if(value instanceof Date)return Utilities.formatDate(value,Session.getScriptTimeZone()||'Asia/Jakarta','yyyy-MM');const text=String(value).trim(),m=text.match(/^(\d{4})-(\d{2})/);return m?m[1]+'-'+m[2]:text;}
function generateMonthlyBills(requestedPeriod){
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const ss=getSpreadsheet_(),customers=readSheetObjects_('Pelanggan').filter(x=>String(x['Status'])==='Aktif'),bills=readSheetObjects_('Tagihan'),settings=getSettings_(),period=requestedPeriod||Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Jakarta','yyyy-MM');
    if(!/^\d{4}-\d{2}$/.test(period))throw new Error('Format periode harus YYYY-MM.');
    const existing={};bills.forEach(b=>existing[String(b['ID Pelanggan'])+'|'+periodKey_(b['Periode'])]=true);const used=getUsedBillIds_(),sh=ss.getSheetByName('Tagihan');
    const dueDay=Math.min(Math.max(Number(settings['JATUH_TEMPO']||5),1),28),year=Number(period.substring(0,4)),month=Number(period.substring(5,7));if(month<1||month>12)throw new Error('Periode bulan tidak valid.');
    const due=new Date(year,month-1,dueDay),rows=[];
    customers.forEach(c=>{const id=String(c['ID Pelanggan']||'').trim(),key=id+'|'+period;if(existing[key])return;const idTag=generateBillId_(period,used);used[idTag]=true;rows.push([idTag,id,c['Nama Pelanggan'],period,due,Number(c['Tarif Bulanan']||0),'Belum Bayar','','']);});
    if(rows.length)sh.getRange(sh.getLastRow()+1,1,rows.length,9).setValues(rows);writeAudit_('GENERATE','Tagihan',period,'Membuat '+rows.length+' tagihan periode '+period);SpreadsheetApp.flush();return{success:true,created:rows.length,message:rows.length+' tagihan baru dibuat untuk periode '+period+'.'};
  }finally{lock.releaseLock();}
}

function auditDatabase(){
  const customers=readSheetObjects_('Pelanggan'),bills=readSheetObjects_('Tagihan'),payments=readSheetObjects_('Pembayaran'),customerMap={};customers.forEach(c=>customerMap[String(c['ID Pelanggan'])]=c);
  const collisionBills=[],groups={};
  bills.forEach(b=>{const id=String(b['ID Pelanggan']||''),name=String(b['Nama']||'').trim(),c=customerMap[id],current=c?String(c['Nama Pelanggan']||'').trim():'';if(c&&name&&current&&name!==current)collisionBills.push({rowIndex:b._rowIndex,billId:b['ID Tagihan'],customerId:id,historicalName:name,currentName:current,period:periodKey_(b['Periode'])});if(c&&name===current){const key=id+'|'+periodKey_(b['Periode'])+'|'+name.toLowerCase();if(!groups[key])groups[key]=[];groups[key].push(b);}});
  const duplicateGroups=Object.keys(groups).map(key=>({key:key,bills:groups[key]})).filter(g=>g.bills.length>1).map(g=>({key:g.key,rows:g.bills.map(b=>({rowIndex:b._rowIndex,billId:b['ID Tagihan'],status:b['Status'],period:periodKey_(b['Periode'])}))}));
  const paymentBillIds={};payments.forEach(p=>{const id=String(p['ID Tagihan']||'');if(id)paymentBillIds[id]=(paymentBillIds[id]||0)+1;});duplicateGroups.forEach(g=>g.rows.forEach(r=>r.paymentCount=paymentBillIds[String(r.billId)]||0));
  return{safe:collisionBills.length===0&&duplicateGroups.length===0,customerCount:customers.length,billCount:bills.length,paymentCount:payments.length,collisionCount:collisionBills.length,duplicateGroupCount:duplicateGroups.length,historicalCollisions:collisionBills,duplicateGroups:duplicateGroups};
}

/* repairDatabase intentionally retained for manual maintenance only. */
function repairDatabase(){throw new Error('repairDatabase() dinonaktifkan dari Web App. Jalankan hanya dari editor Apps Script jika maintenance diperlukan.');}
function testConnection(){return 'Code.gs berhasil dihubungi dari Web App.';}
