# NUSANTARA BUSINESS — MASTER ROADMAP

## Tujuan

Mengembangkan Nusantara WiFi menjadi **Nusantara Business**, satu unified frontend untuk beberapa business module dengan backend tetap modular dan terpisah.

Prinsip utama:

1. **One Frontend** — satu UI, navigation, theme, loading, dan pengalaman pengguna.
2. **Separate Backends** — backend WiFi dan Absensi tetap memiliki service dan data ownership masing-masing.
3. **Production First** — perubahan baru tidak boleh merusak sistem production yang sudah stabil.
4. **Incremental Migration** — migrasi dilakukan bertahap dan aplikasi Absensi lama tetap dapat digunakan selama transisi.
5. **Clear Boundaries** — module tidak boleh saling mengakses database secara langsung; komunikasi melalui service/adapter.

## Status roadmap

| Fase | Nama | Status |
|---|---|---|
| 01 | Production Foundation | Selesai |
| 02 | Architecture Audit & Blueprint | Selesai |
| 03 | Nusantara Business Shell | Selesai |
| 04 | Nusantara Absensi & Payroll Integration | **Sedang Dikerjakan** |
| 05 | Unified Service Layer | **Selesai** |
| 06 | Business Analytics | **Sedang Dikerjakan** |
| 07 | Security & Access Control | Rencana |
| 08 | Reliability & Scale | Rencana |
| 09 | Business Expansion | Rencana |

## Fase 01 — Production Foundation

Fondasi production Nusantara WiFi.

- Customer workspace
- Billing workspace
- Payment dan payment reversal
- Audit trail
- Analytics
- Resilience
- Reliability
- Database integrity
- Duplicate prevention

**Status: SELESAI.**

## Fase 02 — Architecture Audit & Blueprint

Menentukan bagaimana WiFi dan Absensi menjadi module dalam satu platform tanpa memaksa backend digabung.

- Audit repository WiFi dan Absensi
- Mapping backend dan API
- Mapping data ownership
- Unified frontend strategy
- Module boundary
- Migration strategy
- No-downtime strategy

**Status: SELESAI.**

## Fase 03 — Nusantara Business Shell

Membangun shell frontend utama.

- Brand Nusantara Business
- Unified sidebar dan topbar
- Business module navigation
- Shared theme
- Shared loading dan error state
- Module boundary
- Backward-compatible route untuk module lama

**Status: SELESAI.**

## Fase 04 — Nusantara Absensi & Payroll Integration

Phase ini sekarang dibuka. People module masuk ke unified frontend dengan prinsip **read-only first** agar backend Absensi production tetap aman.

### Yang sudah diaktifkan

- Native workspace **Absensi Karyawan**
- Native workspace **Payroll Karyawan**
- Pemilihan periode mingguan
- Refresh data dari backend Apps Script Absensi
- Status sinkronisasi dan error state
- Ringkasan jumlah karyawan, hadir, lembur, dan keterlambatan
- Rekap payroll mingguan
- Perhitungan payroll mengikuti formula aplikasi Absensi existing
- Backend Absensi tetap terpisah dari backend WiFi
- Legacy Absensi tetap dapat digunakan sebagai aplikasi terpisah

### Kontrak read-only

Business Portal **tidak** melakukan tambah, edit, hapus, reset, atau save attendance/payroll. Semua data People dibaca dari endpoint GET backend Absensi. Ini menjaga database People tetap menjadi source of truth tunggal.

### Formula payroll existing

- Gaji pokok = hari hadir × gaji/hari
- Lembur = jam lembur × Rp20.000
- Potongan telat = jam telat × Rp10.000
- Total = pokok + lembur − potongan telat + bonus − kasbon

### Tahap lanjutan Phase 04

- Validasi data periode mingguan terhadap production
- Detail attendance per hari
- Detail employee/payroll drill-down
- Verifikasi hasil payroll terhadap aplikasi Absensi lama
- Final QA sebelum native People dianggap stabil
- Setelah stabil, baru evaluasi kebutuhan write access dan security model

**Status: SEDANG DIKERJAKAN.**

## Fase 05 — Unified Service Layer

Membuat interface frontend yang konsisten terhadap backend yang berbeda.

### Milestone selesai

- registry `Nusantara.services`
- adapter WiFi untuk API production existing
- contract Absensi yang inactive sampai Phase 04
- common success envelope
- contextual service errors
- request success/failure counters
- WiFi `getInitialData`, `testConnection`, dan `auditDatabase`
- Customer CRUD
- Generate Billing
- Payment
- Payment Cancellation
- Final functional QA

Service layer **tidak menjadi database baru** dan tidak menggabungkan backend WiFi dengan Absensi.

**Status: SELESAI.**

## Fase 06 — Business Analytics

Mengubah data operasional menjadi management insight yang dapat digunakan untuk keputusan harian.

### Baseline yang sudah tersedia

- Billing KPI
- Collection KPI
- Revenue vs collection
- Customer signal
- Outstanding aging
- Follow-up priority
- Management decision dashboard
- Billing trend 6 periode

### Milestone tambahan yang sudah diimplementasikan

- Collection performance berdasarkan metode pembayaran
- Rata-rata nilai transaksi valid
- Customer continuity antarperiode
- Customer baru pada periode terpilih
- Billing continuity signal
- Identifikasi pelanggan yang tidak muncul kembali pada billing periode berikutnya

Semua insight di atas bersifat **read-only** dan dihitung dari data `APP` yang sudah dimuat frontend. Tidak ada perubahan pada database, payment flow, atau endpoint production.

### Pengembangan berikutnya

- Validasi trend terhadap data production
- Penyempurnaan overdue/aging berdasarkan tanggal lokal Indonesia
- Management insight lintas module setelah People module tersedia
- Final analytics QA

**Status: SEDANG DIKERJAKAN.**

## Fase 07 — Security & Access Control

Membangun satu identity layer untuk pengguna platform.

- Authentication
- Role
- Permission
- Session management
- Access audit
- Module-level authorization

**Status: RENCANA.**

## Fase 08 — Reliability & Scale

Mempersiapkan platform untuk pertumbuhan volume data dan module.

- Concurrency hardening
- Performance
- Backup dan recovery
- Monitoring
- Maintenance workflow
- Failure isolation

**Status: RENCANA.**

## Fase 09 — Business Expansion

Menambahkan module bisnis sesuai kebutuhan operasional TB Nusantara.

- Inventory
- Purchasing
- Finance / cashflow
- CRM
- Operational integration

**Status: RENCANA.**

## Target architecture

```text
                    NUSANTARA BUSINESS
                         Unified UI
                              |
             +----------------+----------------+
             |                                 |
       NUSANTARA WiFi                    NUSANTARA People
       Billing / Customer                Absensi / Payroll
             |                                 |
       Apps Script #1                     Apps Script #2
             |                                 |
       Google Sheets                      Google Sheets
```

Frontend tidak boleh mengasumsikan bahwa semua module memakai backend yang sama.

## Migration rule

- `main` tetap menjadi stable production branch.
- Development dilakukan melalui branch terpisah.
- Backend production tidak diubah kecuali memang dibutuhkan oleh contract module.
- Database WiFi dan Absensi tidak digabung pada tahap awal.
- Absensi legacy tetap hidup sampai native module terbukti stabil.
- Setiap fase harus dapat diuji secara terisolasi sebelum digabungkan ke production.

## Definition of success

Nusantara Business dianggap berhasil pada tahap awal apabila pengguna dapat membuka satu frontend dan berpindah antara WiFi dan People tanpa merasa berpindah aplikasi, sementara masing-masing backend tetap berjalan independen dan aman.
