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
| 04 | Nusantara Absensi Integration | **Berikutnya** |
| 05 | Unified Service Layer | Rencana |
| 06 | Business Analytics | Rencana |
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
- WiFi diposisikan sebagai production module pertama
- People navigation disiapkan untuk integrasi native berikutnya

**Status: SELESAI.**

## Fase 04 — Nusantara Absensi Integration

Memasukkan Absensi sebagai native module.

- Audit final kontrak API Absensi
- Absensi workspace
- Karyawan
- Payroll
- Weekly attendance period
- Adapter ke backend Apps Script Absensi
- Legacy Absensi tetap aman selama migrasi
- Read/write isolation dan error isolation

**Status: BERIKUTNYA.**

## Fase 05 — Unified Service Layer

Membuat interface frontend yang konsisten terhadap backend yang berbeda.

Contoh kontrak konseptual:

```text
Nusantara.services.wifi.*
Nusantara.services.absensi.*
```

Service layer bertanggung jawab terhadap request lifecycle, normalisasi response, error handling, dan batas akses data.

**Status: RENCANA.**

## Fase 06 — Business Analytics

Mengubah data lintas module menjadi management insight.

- Billing KPI
- Collection KPI
- Attendance KPI
- Payroll KPI
- Cross-module management signal
- Decision dashboard

**Status: RENCANA.**

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

Nusantara Business dianggap berhasil pada tahap awal apabila pengguna dapat membuka satu frontend dan berpindah antara WiFi dan Absensi tanpa merasa berpindah aplikasi, sementara masing-masing backend tetap berjalan independen dan aman.
