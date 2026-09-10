# NUSANTARA BUSINESS — MASTER ROADMAP

## Tujuan

Mengembangkan Nusantara WiFi menjadi **Nusantara Business**, satu unified frontend untuk beberapa business module dengan backend tetap modular dan terpisah.

## Prinsip

1. **One Frontend** — satu UI, navigation, theme, loading, dan pengalaman pengguna.
2. **Separate Backends** — backend WiFi dan People tetap memiliki service dan data ownership masing-masing.
3. **Production First** — perubahan baru tidak boleh merusak production yang sudah stabil.
4. **Incremental Migration** — aplikasi legacy tetap hidup selama transisi.
5. **Clear Boundaries** — module tidak mengakses database module lain secara langsung.

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

- Customer workspace
- Billing workspace
- Payment dan payment reversal
- Audit trail
- Analytics
- Resilience dan reliability
- Database integrity
- Duplicate prevention

**Status: SELESAI.**

## Fase 02 — Architecture Audit & Blueprint

- Audit repository WiFi dan Absensi
- Mapping backend dan API
- Mapping data ownership
- Unified frontend strategy
- Module boundary
- Migration strategy
- No-downtime strategy

**Status: SELESAI.**

## Fase 03 — Nusantara Business Shell

- Brand Nusantara Business
- Unified sidebar dan topbar
- Business module navigation
- Shared theme
- Shared loading dan error state
- Legacy-compatible navigation
- People navigation

**Status: SELESAI.**

## Fase 04 — Nusantara Absensi & Payroll Integration

Phase ini telah berpindah dari read-only prototype menjadi **functional operational workspace**. Backend Absensi production tetap terpisah dari backend WiFi.

### Functional milestone

- Native workspace **Absensi Karyawan**
- Native workspace **Payroll Karyawan**
- Pemilihan periode mingguan
- Minggu sebelumnya / berikutnya / minggu ini
- Load data production Absensi
- Tambah karyawan
- Edit nama dan gaji harian
- Hapus karyawan dengan PIN Admin
- Pencegahan penghapusan karyawan terakhir
- Input Hadir
- Input ½ Hari
- Input jam lembur
- Input jam telat
- Input Bonus
- Input Kasbon
- Auto-save
- Simpan manual
- Reset minggu dengan PIN Admin
- Backup lokal sebelum/selama penyimpanan
- Verifikasi hasil penyimpanan terhadap cloud
- Payroll otomatis dari absensi
- Slip gaji
- Dark mode dan responsive workspace
- Legacy Absensi tetap dapat digunakan selama migrasi

### Formula payroll

- Gaji pokok = hari hadir × gaji/hari
- Lembur = jam lembur × Rp20.000
- Potongan telat = jam telat × Rp10.000
- Total = pokok + lembur − potongan telat + bonus − kasbon

### Service boundary

Unified Service Layer sekarang memiliki adapter `absensi` untuk operasi status, pembacaan minggu, dan penyimpanan minggu. Backend People tetap memakai Apps Script yang terpisah.

### QA gate

Checklist QA tersedia di `docs/PEOPLE-MODULE-QA.md`.

Phase 04 baru dianggap **SELESAI** setelah functional test production oleh pengguna menyatakan input, edit, delete, save, reset, payroll, slip, dan perpindahan minggu berjalan normal.

**Status: SEDANG DIKERJAKAN — FUNCTIONAL BUILD READY FOR QA.**

## Fase 05 — Unified Service Layer

- Registry `Nusantara.services`
- Adapter WiFi
- Common success envelope
- Contextual service errors
- Request success/failure counters
- WiFi read/write contracts
- Absensi status/get/save adapter
- Backend tetap terpisah

**Status: SELESAI.**

## Fase 06 — Business Analytics

### Baseline

- Billing KPI
- Collection KPI
- Revenue vs collection
- Customer signal
- Outstanding aging
- Follow-up priority
- Management decision dashboard
- Billing trend 6 periode
- Collection performance
- Customer continuity

### Berikutnya

- Validasi trend terhadap production
- Penyempurnaan overdue/aging berdasarkan tanggal lokal Indonesia
- People cross-module insight: headcount, attendance, payroll, dan operational signal
- Final analytics QA

**Status: SEDANG DIKERJAKAN.**

## Fase 07 — Security & Access Control

- Authentication
- Role
- Permission
- Session management
- Access audit
- Module-level authorization
- Pengamanan operasi write People di backend

**Status: RENCANA.**

## Fase 08 — Reliability & Scale

- Concurrency hardening
- Performance
- Backup dan recovery
- Monitoring
- Maintenance workflow
- Failure isolation

**Status: RENCANA.**

## Fase 09 — Business Expansion

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

Frontend tidak boleh mengasumsikan semua module memakai backend yang sama.

## Migration rule

- `main` tetap stable production.
- Development dilakukan melalui branch terpisah.
- Backend production tidak diubah kecuali dibutuhkan contract module.
- Database WiFi dan People tidak digabung.
- Absensi legacy tetap hidup sampai native module terbukti stabil.
- Setiap fase diuji secara terisolasi sebelum production.

## Definition of success

Nusantara Business berhasil pada tahap awal apabila pengguna dapat membuka satu frontend dan berpindah antara WiFi dan People tanpa merasa berpindah aplikasi, sementara backend masing-masing tetap independen, data ownership jelas, dan operasi production tetap aman.
