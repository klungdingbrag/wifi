# Nusantara WiFi V6

> **Baseline resmi / stable reference:** `369fe2eac4be1b6538fa66145104593465810033`

Nusantara WiFi V6 adalah aplikasi web operasional yang menggunakan **GitHub Pages sebagai frontend**, **Google Apps Script sebagai backend/API**, dan **Google Sheets sebagai database**.

Repository ini menggunakan commit `369fe2eac4be1b6538fa66145104593465810033` sebagai **baseline resmi untuk pengembangan saat ini**. Perubahan setelah baseline tersebut tidak dianggap sebagai bagian dari versi aktif sampai ditinjau dan diintegrasikan kembali secara sengaja.

## Status Baseline

- **Repository:** `klungdingbrag/wifi`
- **Branch aktif:** `main`
- **Baseline commit:** `369fe2eac4be1b6538fa66145104593465810033`
- **Baseline commit message:** `fix: correct WiFi Apps Script endpoint URL`
- **Frontend:** GitHub Pages
- **Backend:** Google Apps Script Web App
- **Database:** Google Sheets
- **Bahasa utama:** JavaScript
- **Target aplikasi:** `https://klungdingbrag.github.io/wifi/`

### Aturan baseline

1. Commit baseline di atas menjadi **titik acuan (reference point)** untuk audit, debugging, dan pengembangan berikutnya.
2. Jangan mengubah baseline secara langsung tanpa memahami dampaknya terhadap frontend, backend, dan database.
3. Perubahan besar sebaiknya dibuat melalui branch terpisah terlebih dahulu.
4. Setelah perubahan diuji, perubahan dapat dibandingkan terhadap baseline sebelum diintegrasikan ke `main`.
5. Jika eksperimen menghasilkan masalah, kondisi `main` dapat dikembalikan ke baseline ini.

## Arsitektur Sistem

```
┌──────────────────────────────┐
│        GitHub Pages          │
│          Frontend            │
│                              │
│ index.html                   │
│ css/*                        │
│ js/*                         │
└──────────────┬───────────────┘
               │ HTTPS
               ▼
┌──────────────────────────────┐
│    Google Apps Script        │
│        Web App / API         │
│                              │
│ code.gs                      │
│ setup.gs                     │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│        Google Sheets         │
│          Database            │
└──────────────────────────────┘
```

Frontend tidak menyimpan database utama. Data operasional diproses melalui backend Google Apps Script dan disimpan pada Google Sheets.

## Struktur Utama

### Frontend

- `index.html` — entry point aplikasi.
- `css/` — stylesheet dan UI system.
- `js/app.js` — application core dan konfigurasi API.
- `js/*workspace.js` — workspace/modul aplikasi.
- `js/*analytics*.js` — analytics dan trend.
- `js/*reliability*.js` — reliability/resilience layer.
- `js/theme*.js` — theme system.
- `js/ui-loading.js` — loading state dan feedback UI.

### Backend

- `code.gs` — Google Apps Script backend/API.
- `setup.gs` — setup dan struktur database.

### Diagnostics

- `diagnostics.html`
- `diagnostics-payment.html`
- `diagnostics-payment-v2.html`

File diagnostics digunakan untuk membantu pemeriksaan koneksi, API, dan alur pembayaran tanpa harus mengubah aplikasi utama.

### Dokumentasi

- `docs/NUSANTARA-BUSINESS-ROADMAP.md`
- `docs/PEOPLE-MODULE-QA.md`
- `docs/UNIFIED-SERVICE-LAYER.md`

## Backend Setup

1. Buka project Google Apps Script yang terhubung dengan spreadsheet Nusantara WiFi.
2. Gunakan `code.gs` dari repository sebagai referensi backend.
3. **Jangan menjalankan `setupDatabase()` ulang pada database produksi yang sudah berisi data**, kecuali struktur dan dampaknya sudah diperiksa.
4. Deploy Google Apps Script sebagai **Web App**.
5. Pilih **Execute as: Me**.
6. Atur **Who has access** sesuai kebutuhan deployment.
7. Salin URL Web App yang berakhiran `/exec`.
8. Pastikan frontend menggunakan URL endpoint yang benar pada `js/app.js`.

## Frontend Deployment

GitHub Pages digunakan untuk menyajikan frontend.

Target deployment:

```
https://klungdingbrag.github.io/wifi/
```

Perubahan pada frontend harus memperhatikan:

- path file relatif GitHub Pages;
- urutan pemuatan JavaScript;
- dependency antar-module;
- endpoint Apps Script;
- response API;
- loading/error state;
- kompatibilitas dengan struktur Google Sheets.

## Prinsip Pengembangan

### 1. Baseline first

Sebelum melakukan perubahan, bandingkan perubahan terhadap baseline.

### 2. Backend contract first

Jangan mengubah frontend dengan asumsi mengenai API. Periksa terlebih dahulu:

- nama action;
- parameter;
- format request;
- format response;
- error response;
- struktur data.

### 3. Small changes

Perubahan sebaiknya kecil dan terukur. Hindari melakukan refactor besar pada banyak modul sekaligus sebelum penyebab masalah diketahui.

### 4. Diagnostics before redesign

Jika terjadi error koneksi atau data, gunakan halaman diagnostics dan pemeriksaan backend terlebih dahulu sebelum merombak UI atau arsitektur.

### 5. Preserve working behavior

Fungsi yang sudah bekerja pada baseline dianggap sebagai **known-good behavior** sampai ditemukan bukti teknis yang menunjukkan sebaliknya.

## Catatan Fungsional

- `wa.me` digunakan untuk membuka WhatsApp dari browser dan tidak memerlukan WhatsApp API.
- Histori Tagihan/Pembayaran tidak ikut dihapus ketika pelanggan dihapus.
- Dashboard/operasional hanya menampilkan tagihan pelanggan yang masih ada di master Pelanggan.
- API belum memiliki login/authentication aplikasi.
- Jika Google Apps Script Web App dibuka untuk `Anyone`, endpoint secara teknis dapat dipanggil oleh pihak lain yang mengetahui URL.
- Authentication/API key dapat ditambahkan sebagai tahap hardening berikutnya.

## Workflow Pengembangan yang Direkomendasikan

```
BASELINE
   │
   ▼
ANALYZE
   │
   ▼
CREATE BRANCH
   │
   ▼
CHANGE
   │
   ▼
DIAGNOSTIC / TEST
   │
   ▼
COMPARE WITH BASELINE
   │
   ├── masalah → kembali / perbaiki
   │
   └── valid → review
              │
              ▼
            MERGE
```

Baseline tidak boleh dianggap sebagai target yang tidak dapat diperbaiki. Baseline adalah **versi referensi yang saat ini dipilih sebagai kondisi kerja yang stabil**, sehingga setiap peningkatan berikutnya dapat diukur terhadap kondisi tersebut.

## Baseline Integrity

Commit baseline:

```
369fe2eac4be1b6538fa66145104593465810033
```

Commit ini memperbaiki konfigurasi endpoint Google Apps Script pada `js/app.js`.

Untuk pengembangan berikutnya, gunakan commit ini sebagai **known-good reference** dan jangan menganggap perubahan eksperimental sebagai bagian dari baseline sebelum melalui proses pengujian.

---

**Nusantara WiFi V6 — Baseline Documentation**

Baseline: `369fe2eac4be1b6538fa66145104593465810033`
