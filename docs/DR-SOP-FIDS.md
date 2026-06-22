# SOP DISASTER RECOVERY & BUSINESS CONTINUITY
## Flight Information Display System (FIDS) — APT Pranoto AAP Samarinda

| | |
|---|---|
| **Dokumen** | SOP Backup, Restore & Disaster Recovery |
| **Sistem** | FIDS APT Pranoto |
| **Versi** | 1.0 |
| **Pemilik** | Unit TI / Operasi Bandara |
| **Terkait Audit** | Temuan M-05 |

---

## 1. Tujuan
Menjamin **ketersediaan data penerbangan** dan **pemulihan layanan** FIDS pada lingkungan operasional 24/7, dengan target waktu pemulihan terukur, prosedur baku, dan kelangsungan tampilan informasi bagi penumpang saat terjadi gangguan.

## 2. Sasaran Pemulihan (RTO / RPO)

| Metrik | Target | Cara Pencapaian |
|---|---|---|
| **RPO (Recovery Point Objective)** | **≤ 24 jam** (dasar) → **≤ 15 menit** (lanjutan) | Backup `mysqldump` harian (dasar); aktifkan **MySQL binary log** untuk *point-in-time recovery* (lanjutan) |
| **RTO (Recovery Time Objective)** | **≤ 30–60 menit** | SOP restore terbaku + `deploy.sh` + *warm standby* / image siap pakai |
| **Retensi Backup** | **14 hari** lokal + **30–90 hari** offsite | `scripts/backup.sh` (retensi) + sinkronisasi S3/MinIO/NAS |

## 3. Cakupan Backup
1. **Database MySQL** — seluruh data operasional & master (`fids_apt_pranoto`).
2. **Media** — `storage/app/public` (logo bandara, gambar counter, iklan).
3. **Konfigurasi** — `.env` produksi (disimpan terpisah di brankas/secret manager, **tidak** di repositori).
4. **Kode** — versi terkelola di Git (GitHub `elband/fids`).

## 4. Prosedur Backup (Otomatis)

### 4.1 Penjadwalan (cron, server produksi)
```bash
# Backup harian 02:00
0 2 * * * /var/www/fids/scripts/backup.sh >> /var/log/fids-backup.log 2>&1
```
Skrip [`scripts/backup.sh`](../scripts/backup.sh) melakukan: dump DB (`--single-transaction`, routine/trigger/event) → gzip → arsip media → verifikasi integritas gzip → pangkas retensi → (opsional) salin offsite.

### 4.2 Verifikasi Backup (mingguan)
- Pastikan berkas terbaru ada di `/var/backups/fids/db` & `/media`.
- Uji `gzip -t` (sudah otomatis di skrip).
- **Restore test** ke database *staging* minimal **1×/bulan** (lihat §5) — backup yang tak pernah diuji dianggap tidak ada.

## 5. Prosedur Restore
Gunakan [`scripts/restore.sh`](../scripts/restore.sh):
```bash
./scripts/restore.sh \
  /var/backups/fids/db/fids_db_YYYYMMDD_HHMMSS.sql.gz \
  /var/backups/fids/media/fids_media_YYYYMMDD_HHMMSS.tar.gz
```
Skrip otomatis: *maintenance mode* (`artisan down`) → restore DB → restore media → `storage:link` → `optimize:clear` → `artisan up`.

## 6. SOP Pemulihan Bencana (Server Hilang Total)

| Langkah | Aksi | Target Waktu |
|---|---|---|
| 1 | **Deteksi & deklarasi insiden** (alert monitoring / laporan operasi) | 0–5 mnt |
| 2 | **Siapkan node pengganti** (VM/image/IaC), pasang Ubuntu LTS + Nginx + PHP-FPM + MySQL + Redis | 5–20 mnt |
| 3 | `git clone` repo → salin `.env` dari brankas → `composer install --no-dev` → `npm ci && npm run build` (atau pakai image siap) | 10–25 mnt |
| 4 | **Restore DB & media** via `scripts/restore.sh` (+ apply binlog s.d. titik kegagalan bila tersedia) | 5–15 mnt |
| 5 | `php artisan optimize` + `storage:link` + set permission | 2–5 mnt |
| 6 | **Validasi**: `/up` health, login admin, render `/public/screen`, cek data penerbangan H-ini | 3–5 mnt |
| 7 | **Alihkan DNS/Load Balancer** ke node baru | 1–5 mnt |
| 8 | **Post-mortem** & dokumentasi insiden | pasca |

> **Total estimasi RTO: ~30–60 menit** (lebih cepat bila *warm standby* aktif).

## 7. Strategi High Availability (Rekomendasi Lanjutan)
- **2× node aplikasi** di belakang Load Balancer (Nginx/HAProxy) → hilangkan *single point of failure*.
- **MySQL primary + replica** (failover) untuk ketahanan basis data.
- **Redis** untuk session/cache/queue (lepas dari MySQL) — sekaligus memperbaiki skalabilitas (audit M-03).
- **Media di S3/MinIO** agar tidak terikat satu node (audit m-06).

## 8. Business Continuity — Kelangsungan Tampilan
- **Mode Luring Layar (audit M-02 — sudah diterapkan):** layar publik menyimpan respons API terakhir di `localStorage`; saat API/jaringan gagal, layar **tetap menampilkan data penerbangan terakhir** disertai banner "Mode Luring (per HH:MM)". Lihat `resources/js/lib/offlineCache.ts`.
- **Isolasi jaringan monitor:** tempatkan monitor pada VLAN khusus; batasi endpoint mutasi API ke segmen ini (firewall/Nginx allowlist).
- **Runbook tercetak** di ruang operasi + daftar kontak eskalasi.
- **DR Drill** terjadwal **≥ 2×/tahun** (uji restore penuh + failover).

## 9. Matriks Tanggung Jawab (RACI ringkas)
| Aktivitas | Operator | Admin TI | Koord. TI |
|---|---|---|---|
| Pemantauan harian | R | A | I |
| Eksekusi backup (otomatis) | I | A | I |
| Restore test bulanan | — | R | A |
| Deklarasi & penanganan insiden | I | R | A |
| DR Drill semesteran | I | R | A |

## 10. Lampiran — Aktivasi Point-in-Time Recovery (PITR)
Aktifkan binary log di MySQL (`my.cnf`):
```ini
[mysqld]
log_bin = /var/log/mysql/mysql-bin.log
binlog_expire_logs_seconds = 1209600   # 14 hari
server_id = 1
```
Restore PITR: pulihkan dump harian → `mysqlbinlog --start-datetime=... --stop-datetime=<sebelum-insiden> | mysql`.

---
*Dokumen ini bagian dari remediasi temuan audit M-05. Tinjau & uji minimal setiap 6 bulan.*
