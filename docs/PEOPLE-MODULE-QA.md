# NUSANTARA BUSINESS — PEOPLE MODULE QA

## Scope

Validasi native **Absensi** dan **Payroll** terhadap aplikasi Absensi utama.

Backend People tetap terpisah dari WiFi dan menggunakan Apps Script Absensi production yang sama.

## Absensi

- [ ] Memuat minggu aktif
- [ ] Minggu sebelumnya
- [ ] Minggu berikutnya
- [ ] Kembali ke minggu ini
- [ ] Tambah karyawan
- [ ] Edit nama karyawan
- [ ] Edit gaji harian
- [ ] Hapus karyawan dengan PIN Admin
- [ ] Mencegah penghapusan karyawan terakhir
- [ ] Input Hadir
- [ ] Input ½ Hari
- [ ] Input jam lembur
- [ ] Input jam telat
- [ ] Menghapus status Hadir mengosongkan ½ Hari/lembur/telat
- [ ] Input Bonus
- [ ] Input Kasbon
- [ ] Auto-save
- [ ] Simpan manual
- [ ] Refresh browser mempertahankan data
- [ ] Pindah minggu tidak mengubah minggu lain
- [ ] Reset minggu meminta PIN Admin
- [ ] Kegagalan cloud tidak menganggap data berhasil tersimpan

## Payroll

- [ ] Hari hadir dihitung sesuai absensi
- [ ] ½ Hari dihitung 0,5 hari
- [ ] Gaji pokok = hadir × gaji/hari
- [ ] Lembur = jam lembur × Rp20.000
- [ ] Potongan telat = jam telat × Rp10.000
- [ ] Bonus masuk ke total
- [ ] Kasbon mengurangi total
- [ ] Total payroll berubah langsung setelah perubahan absensi
- [ ] Grand total sesuai jumlah seluruh karyawan
- [ ] Slip gaji menampilkan periode yang benar
- [ ] Slip gaji menampilkan komponen payroll dengan benar

## Integrity

- [ ] Data Business Portal sama dengan aplikasi Absensi utama setelah refresh
- [ ] Tidak ada data WiFi yang berubah akibat operasi People
- [ ] Backend WiFi tetap normal
- [ ] Dark mode normal
- [ ] Mobile layout dapat digunakan
- [ ] Legacy Absensi tetap dapat dibuka selama migrasi

## Status

Implementasi functional tersedia di branch `refactor/clean-structure`.

Status akhir Phase 04 ditentukan setelah checklist production selesai diuji pengguna.
