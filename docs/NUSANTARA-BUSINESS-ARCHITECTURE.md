# NUSANTARA BUSINESS — Architecture Blueprint

Status: **Architecture baseline / Phase 01**

Dokumen ini menjadi kontrak arsitektur awal untuk mengubah Nusantara WiFi dan Nusantara Absensi menjadi satu unified business platform tanpa memaksa kedua backend menjadi satu.

## 1. Prinsip utama

- **One frontend, multiple services.** UI, navigation, theme, loading state, dan pengalaman pengguna disatukan.
- **Backend tetap terpisah.** Backend WiFi dan backend Absensi tidak digabung pada tahap ini.
- **Production-first.** Sistem WiFi yang sudah stabil diperlakukan sebagai production foundation dan tidak dirombak hanya karena proses integrasi.
- **Module boundary jelas.** Setiap domain memiliki service adapter sendiri.
- **No forced database merge.** Spreadsheet WiFi dan Spreadsheet Absensi tetap menjadi data store masing-masing.
- **Progressive migration.** Aplikasi Absensi lama tetap dapat hidup selama versi unified belum terbukti stabil.
- **Read/write safety.** Integrasi baru tidak boleh mengubah data hanya karena proses membaca atau sinkronisasi.

## 2. Audit repository saat ini

### Nusantara WiFi — `klungdingbrag/wifi`

Frontend saat ini sudah berbentuk SPA modular dengan halaman Dashboard, Tagihan, Pelanggan, Pembayaran, Histori, dan Roadmap. Fondasi UI sudah memiliki theme system Light/Dark, module navigation, analytics, management decision, payment workspace, resilience, dan reliability hardening.

Backend WiFi menggunakan Google Apps Script Web App dan Google Sheets. Endpoint GET yang teridentifikasi: `getInitialData`, `testConnection`, `auditDatabase`. Endpoint POST mencakup customer CRUD/status, `payBill`, `cancelPayment`, `generateMonthlyBills`, dan fungsi repair internal.

Database utama: `Pelanggan`, `Tagihan`, `Pembayaran`, `Audit_Log`, `Rencana_Progres`, `Pengaturan`, dan `Pelanggan_Arsip`.

### Nusantara Absensi — `klungdingbrag/absensi`

Frontend saat ini terdiri dari modul employee, attendance, payroll, cloud, render, print, export, state, utils, dan konfigurasi. Backend berada di `google-apps-script/Code.gs` dan menggunakan Web App URL yang berbeda dari WiFi.

API saat ini sederhana dan terfokus pada data mingguan:
- GET `action=get&weekStart=YYYY-MM-DD` untuk membaca satu periode.
- POST `action=save` untuk menyimpan satu periode mingguan.

Backend Absensi menggunakan sheet `ABSENSI_MINGGUAN` dengan backup `ABSENSI_BACKUP`. Data absensi mingguan disimpan sebagai JSON dalam satu record periode. Backend sudah menggunakan LockService, validasi periode, duplicate-week protection, backup sebelum overwrite, dan verifikasi save dilakukan oleh frontend.

## 3. Module boundary

```text
NUSANTARA BUSINESS
│
├── Core Platform
│   ├── navigation
│   ├── theme
│   ├── loading / sync state
│   ├── notifications
│   ├── routing
│   └── access control (future)
│
├── WiFi Module
│   ├── Pelanggan
│   ├── Tagihan
│   ├── Pembayaran
│   ├── Histori
│   └── WiFi Analytics
│
└── People Module
    ├── Karyawan
    ├── Absensi
    └── Payroll
```

Domain module tidak boleh langsung memanggil backend module lain. Cross-module communication harus melalui service layer atau read-only aggregation layer.

## 4. Service layer yang dituju

```javascript
Nusantara.services.wifi.getInitialData()
Nusantara.services.wifi.payBill(...)
Nusantara.services.wifi.cancelPayment(...)

Nusantara.services.absensi.getWeek(weekStart)
Nusantara.services.absensi.saveWeek(payload)
```

Tujuannya adalah mengisolasi URL Apps Script, format request, error handling, retry policy, dan response normalization dari UI.

## 5. Data ownership

| Domain | Owner backend | Data store | Frontend module |
|---|---|---|---|
| WiFi customers | WiFi GAS | WiFi Spreadsheet | WiFi / Pelanggan |
| WiFi billing | WiFi GAS | WiFi Spreadsheet | WiFi / Tagihan |
| WiFi payments | WiFi GAS | WiFi Spreadsheet | WiFi / Pembayaran |
| WiFi audit | WiFi GAS | WiFi Spreadsheet | System / Histori |
| Employees | Absensi GAS | Absensi Spreadsheet | People / Karyawan |
| Attendance | Absensi GAS | `ABSENSI_MINGGUAN` | People / Absensi |
| Payroll | Absensi domain | Absensi data | People / Payroll |

Belum ada keputusan untuk membuat database pusat. Integrasi data lintas domain dilakukan pada frontend/service layer terlebih dahulu.

## 6. Strategi migrasi tanpa downtime

1. Pertahankan WiFi production sebagai baseline.
2. Pertahankan Absensi legacy sebagai fallback selama migrasi.
3. Bangun unified shell tanpa mengubah backend.
4. Tambahkan service adapter Absensi.
5. Implementasikan Absensi workspace baru di UI Nusantara Business.
6. Bandingkan hasil baca versi unified dengan aplikasi legacy.
7. Uji write path Absensi secara terbatas dan terverifikasi.
8. Setelah stabil, jadikan unified Absensi sebagai primary UI.
9. Legacy Absensi tetap tersedia sebagai emergency fallback sebelum akhirnya dipensiunkan.

## 7. Security direction

PIN yang saat ini berada pada frontend Absensi tidak dianggap sebagai authentication layer final. Unified platform nantinya membutuhkan session dan role-based access control. Tahap ini belum mengubah security backend production.

Role awal yang direncanakan:
- Owner
- Admin
- Staff

Detail permission akan ditetapkan pada fase Security & Access Control.

## 8. Keputusan yang sengaja ditunda

- Penggabungan spreadsheet.
- Penggabungan Google Apps Script menjadi satu backend.
- API gateway terpisah.
- Single sign-on penuh.
- Migrasi database ke SQL.
- Perubahan besar pada backend WiFi production.

Keputusan tersebut dapat dipertimbangkan ketika volume dan kebutuhan integrasi benar-benar membutuhkannya.

## 9. Definition of Done untuk unified platform

Nusantara Business dianggap berhasil pada fase integrasi awal jika:

- satu URL frontend menjadi entry point utama;
- theme dan navigation konsisten;
- WiFi tetap berfungsi tanpa regresi;
- Absensi dapat membaca dan menulis backend Absensi melalui service adapter;
- error pada satu backend tidak membuat module backend lain mati;
- data ownership tetap jelas;
- legacy Absensi masih dapat digunakan selama masa transisi;
- tidak ada perubahan database production yang tidak direncanakan.
