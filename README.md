# Nusantara WiFi V6 — GitHub Pages

Frontend GitHub Pages + Backend Google Apps Script + Database Google Sheets.

## 1. Backend
1. Buka project Apps Script yang terhubung ke spreadsheet Nusantara WiFi.
2. Ganti `Code.gs` dengan `Code.gs` pada folder backend ini.
3. **Jangan menjalankan `setupDatabase()` lagi** jika database produksi sudah berisi data. `Setup.gs` tetap gunakan versi yang sekarang.
4. Deploy > New deployment > Web app.
5. Execute as: **Me**.
6. Who has access: pilih akses yang memang Anda butuhkan (untuk frontend publik, biasanya Anyone).
7. Copy URL Web App yang berakhiran `/exec`.

## 2. Frontend
1. Buka `js/app.js`.
2. Ganti `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` dengan URL Web App `/exec`.
3. Upload `index.html`, folder `css`, dan folder `js` ke repository GitHub Pages Anda.
4. URL target: `https://klungdingbrag.github.io/wifi/`.

## 3. Catatan penting
- `wa.me` tetap dipakai untuk membuka WhatsApp dari browser. Tidak membutuhkan WhatsApp API.
- Histori Tagihan/Pembayaran tidak ikut dihapus ketika pelanggan dihapus.
- Dashboard/operasional hanya menampilkan tagihan pelanggan yang masih ada di master Pelanggan.
- API ini belum memiliki login/authentication aplikasi. Jika Web App dibuka untuk Anyone, endpoint secara teknis dapat dipanggil pihak lain yang mengetahui URL. Tahap berikutnya dapat ditambah API key/auth.
