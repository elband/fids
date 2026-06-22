# LAPORAN AUDIT TEKNIS & GO-LIVE REVIEW
## Flight Information Display System (FIDS) — APT Pranoto AAP Samarinda

---

| | |
|---|---|
| **Nama Sistem** | Flight Information Display System (FIDS) – APT Pranoto AAP Samarinda |
| **Klasifikasi Dokumen** | RAHASIA – Internal Manajemen / Go-Live Review |
| **Jenis Audit** | Technical Deep-Dive, Security (OWASP Top 10:2021), Production Readiness |
| **Metode** | Independent External Review — *white-box* (source code), konfigurasi, basis data, dan arsitektur |
| **Periode Audit** | Juni 2026 |
| **Versi Sistem** | Branch `main` @ commit terkini |
| **Lingkungan Operasional** | Bandara, 24/7, *mission-supporting* |
| **Auditor** | Tim Audit TI Independen (Enterprise Solution Architecture, DevOps, Cyber Security/OWASP, DBA, IT Audit) |
| **Status Dokumen** | FINAL v1.0 |

> **Disclaimer Auditor.** Temuan dalam laporan ini didasarkan pada pemeriksaan langsung terhadap *source code*, berkas migrasi basis data, berkas konfigurasi, dan definisi *route* yang tersedia pada repositori per periode audit. Laporan tidak mencakup *penetration testing* aktif terhadap lingkungan produksi, *load test* aktual, maupun audit perangkat keras fisik monitor/jaringan. Estimasi performa bersifat analitis (*capacity modeling*), bukan hasil pengukuran. Setiap temuan disertai rujukan bukti (berkas/baris) agar dapat diverifikasi ulang secara independen.

---

# DAFTAR ISI

1. Executive Summary
2. Gambaran Sistem
3. Arsitektur Sistem
4. Temuan Audit (per Domain)
5. Analisis Risiko
6. Matriks Risiko
7. Temuan Kritis
8. Temuan Mayor
9. Temuan Minor
10. Rekomendasi Teknis
11. Roadmap Perbaikan
12. Checklist Go-Live
13. Kesimpulan
14. Production Readiness Score

---

# 1. EXECUTIVE SUMMARY

## 1.1 Konteks

FIDS APT Pranoto adalah sistem informasi penerbangan yang terdiri atas **Panel Admin** (Laravel 13 + Inertia/React) untuk operator dan **Layar Publik** (monitor TV) yang menampilkan data keberangkatan, kedatangan, gate, *check-in counter*, klaim bagasi, pengumuman, iklan, cuaca, dan *world clock*. Layar publik menarik data via **REST API dengan mekanisme polling ±10 detik**.

Secara umum, FIDS menunjukkan **fondasi rekayasa perangkat lunak yang baik**: struktur kode rapi mengikuti konvensi Laravel/Inertia, pemisahan halaman yang jelas, *eager loading* untuk menghindari N+1 pada sebagian besar kueri, integritas referensial basis data yang konsisten (*foreign key* dengan *on delete* yang benar), serta *scheduler* untuk operasi harian (arsip, generate jadwal, sinkronisasi cuaca).

Namun, untuk standar **sistem operasional bandara 24/7**, audit menemukan **sejumlah celah material pada domain Keamanan (Access Control), Keandalan Layar (Display Reliability), dan Skalabilitas (caching/HA)** yang **harus** ditangani sebelum Go-Live.

## 1.2 Temuan Utama (Headline)

| # | Temuan | Severity | Domain |
|---|--------|----------|--------|
| C-01 | **Registrasi pengguna terbuka untuk publik** dan pengguna baru langsung diarahkan ke area admin | **KRITIS** | Access Control |
| C-02 | **RBAC (Spatie) tidak ditegakkan di level *route*** — seluruh modul admin hanya dilindungi `auth`+`verified`, bukan `role`/`permission` | **KRITIS** | Access Control / Insecure Design |
| C-03 | **Endpoint API publik tanpa autentikasi yang dapat menghapus data** (`POST /api/fids/announcements/{id}/played` melakukan `increment` + `delete`) | **KRITIS** | Broken Access Control |
| M-01 | **Tidak ada *rate limiting*** pada seluruh *endpoint* API publik (risiko DoS & *scraping*) | MAYOR | API Security |
| M-02 | **Tidak ada *fallback offline*/cache lokal** pada layar publik; kegagalan API/jaringan dapat mengosongkan tampilan saat *refresh* | MAYOR | Display Reliability |
| M-03 | **Session, Cache, dan Queue seluruhnya di MySQL**; tanpa Redis & tanpa *caching* respons API → MySQL menjadi *bottleneck* saat banyak monitor | MAYOR | Scalability |
| M-04 | **Index basis data operasional belum ada** pada kolom yang sering difilter (`tanggal_penerbangan`, `jenis_penerbangan`, `is_master`, `status`, `jam_jadwal`) | MAYOR | Database |
| M-05 | **Belum ada strategi Backup/DR terdokumentasi**; RTO/RPO tidak terdefinisi | MAYOR | HA/DR |
| m-01..n | Konsistensi kontrak API, *exception handling* default, cakupan tes bisnis ~0, observability belum ada, *single point of failure* server tunggal | MINOR–MAYOR | Beragam |

## 1.3 Putusan Kesiapan Produksi

> **Production Readiness Score: 53/100 — Grade D (Perlu Perbaikan Mayor).**
>
> Sistem **belum direkomendasikan Go-Live** ke lingkungan operasional bandara 24/7 **sampai 3 temuan KRITIS (C-01, C-02, C-03) ditutup** dan mitigasi keandalan layar (M-02) serta *backup* (M-05) diterapkan. Setelah temuan KRITIS + MAYOR prioritas ditutup, sistem diproyeksikan naik ke **Grade B (Siap Produksi)**.

---

# 2. GAMBARAN SISTEM

## 2.1 Tujuan Bisnis
Menyediakan informasi penerbangan *real-time* kepada penumpang dan publik melalui jaringan monitor, serta menyediakan panel operasional bagi petugas AODB/operasi bandara untuk mengelola jadwal dan sumber daya (gate, counter, belt bagasi).

## 2.2 Domain Fungsional
Flight, Airline, Airport, Airplane, Route, Gate, Check-in Counter, Baggage Claim, Announcement (PAS/suara), Advertisement, CCTV, Weather (BMKG), World Clock, Display Setting, User Management, Reason/Remark (master pendukung).

## 2.3 Karakteristik Operasional
- **Ketersediaan**: diharapkan 24/7.
- **Pola data**: jadwal *master* → *generate* jadwal harian operasional → arsip harian.
- **Konsumen utama**: monitor TV (kiosk *browser*, tanpa interaksi pengguna) + operator (panel admin).
- **Integrasi eksternal**: BMKG (cuaca), NTP (sinkronisasi waktu), API transaksi (kompatibilitas format eksternal).

## 2.4 Tech Stack (terverifikasi dari `composer.json` & `package.json`)
- Backend: **Laravel ^13.7**, PHP **^8.3**, Sanctum ^4, Spatie Permission ^7.4, Ziggy ^2, barryvdh/laravel-dompdf ^3.1, league/flysystem-aws-s3-v3 ^3.32.
- Frontend: **React 18**, **TypeScript**, **Inertia.js ^2.0**, **Vite ^8**, TailwindCSS, `@vitejs/plugin-react`.
- Data: **MySQL**; Session/Cache/Queue driver = **database** (lihat `.env.production`).

---

# 3. ARSITEKTUR SISTEM

## 3.1 Pola Arsitektur
FIDS menganut **monolit Inertia** dengan dua kanal antarmuka:

```
                    ┌──────────────────────────────────────────┐
   Operator  ─────► │  PANEL ADMIN  (auth+verified)            │
                    │  Laravel Controller → Inertia::render()  │
                    │  → React Page (TSX)                       │
                    └───────────────┬──────────────────────────┘
                                    │ menulis
                                    ▼
                    ┌──────────────────────────────────────────┐
   Scheduler ─────► │  MySQL  (flights, counters, gates, dst.)  │
   (cron)           └───────────────┬──────────────────────────┘
                                    │ membaca
                                    ▼
                    ┌──────────────────────────────────────────┐
   Monitor TV ◄──── │  REST API publik (/api/fids/*, web /api)  │
   (polling 10s)    │  DisplayController / DisplayApiController  │
                    └──────────────────────────────────────────┘
```

## 3.2 Penilaian Kualitas Arsitektur

| Aspek | Penilaian | Catatan |
|---|---|---|
| **Separation of Concern** | Cukup baik | Pemisahan Admin / Display / Api / Auth jelas; namun **Service Layer sangat tipis** (hanya `FlightService`, `AudioService`) — sebagian besar logika berada di Controller. |
| **Maintainability** | Baik | Konvensi konsisten, penamaan jelas, komponen UI *reusable* (`MasterHero`, `Modal`, `FlightList`). |
| **Scalability** | **Lemah** | *Single node*; Session/Cache/Queue di MySQL; tanpa *caching* respons API; polling banyak monitor langsung memukul DB. |
| **Availability / Fault Tolerance** | **Lemah** | Tidak ada redundansi server, tidak ada *fallback* data layar, tidak ada *health-based failover*. `/up` *health endpoint* tersedia (positif). |
| **Service Layer Pattern** | Parsial | Anti-pattern *Fat Controller* pada beberapa modul (validasi + logika + transformasi di controller). |
| **Code Structure** | Baik | Mengikuti *skeleton* Laravel 11+/Inertia modern (`bootstrap/app.php`). |

**Kelebihan.** Struktur modular, *eager loading* memadai, *scheduler* domain yang relevan, pemisahan API publik untuk display.
**Kekurangan.** *Service layer* tipis, tanpa lapisan *caching*, *single point of failure*, RBAC tidak ditegakkan di tepi (*edge*).
**Risiko.** Beban DB tak terkendali pada skala monitor besar; kegagalan satu node = *total outage*; perubahan logika tersebar di controller meningkatkan *regression risk*.
**Rekomendasi.** Lihat §10 (Service Layer, Redis cache, HA, RBAC *edge enforcement*).

---

# 4. TEMUAN AUDIT (PER DOMAIN)

## 4.1 Laravel Backend Audit — **Skor: 62/100**

**Route Design.** *Resource routes* dipakai konsisten (`Route::resource`) + *custom routes* untuk aksi domain (remove-flight, broadcast). **Namun seluruh grup `admin` hanya memakai middleware `['auth','verified']`** (bukti: `routes/web.php:83`) — tanpa `role:`/`permission:`. → lihat C-02.

**Controller Design.** Sebagian *Fat Controller*: validasi inline + logika + transformasi berada di controller (mis. `CheckinCounterController`, `PublicAnnouncementController`). Sebagian kecil memakai *Form Request* (`FlightRequest`, `StoreAirlineRequest`, `UpdateAirlineRequest`), namun `authorize()` semuanya `return true` (bukti: `app/Http/Requests/Admin/FlightRequest.php:14`) → otorisasi diserahkan ke middleware yang **tidak** memuat RBAC.

**Service Layer.** Hanya 2 *service* (`FlightService`, `AudioService`). Logika domain (mis. *assign flight* ke counter, transisi status) tersebar di controller. *Technical debt* moderat.

**Validation.** Ada (inline & FormRequest), termasuk *regex* pembatas pada isi pengumuman PAS (positif). Duplikasi aturan validasi `store`/`update` (mis. `PublicAnnouncementController`) = *minor debt*.

**Middleware.** `HandleInertiaRequests` berbagi `auth.user`, `auth.roles`, `logoBandara`, `flash` (wajar). `ValidatePostSize` **di-remove** (`bootstrap/app.php`) → menghilangkan batas ukuran POST tingkat *framework* (relevan dengan unggahan iklan ≤200MB). Perlu kompensasi batas di *web server* (Nginx `client_max_body_size`).

**Exception Handling.** `withExceptions(){ // }` **kosong** (`bootstrap/app.php`) → memakai *handler* default; tidak ada pelaporan terpusat/integrasi *error tracking*. Halaman error kustom tersedia (positif).

**Logging.** Minim (±9 pemanggilan `Log::`), umumnya *audit trail* domain (`FlightStatusLog`, `DailyResetLog`). Tidak ada *structured logging* untuk API publik / kegagalan integrasi.

**Event-Driven / Queue.** **Tidak ada** direktori `app/Jobs`, `app/Events`, `app/Listeners` (selain `Registered` bawaan). Padahal `QUEUE_CONNECTION=database` → *queue worker* yang didokumentasikan di `deploy.sh` saat ini tidak memproses pekerjaan apa pun. *Queue readiness*: belum dimanfaatkan.

**Anti-Pattern / Dead Code / Potential Bug.**
- *Fat Controller* (anti-pattern).
- *Dead route*: `admin.public-announcements.increment-count` (`routes/web.php:137`) tidak lagi dipakai *frontend* setelah dipindah ke API publik — *dead/duplicate path* yang justru bermutasi data → bersihkan atau lindungi.
- *Logic risk*: layar publik `PublicScreenRealtime` memakai `router.reload` (Inertia) tiap 10 dtk — kegagalan server berisiko memunculkan *error overlay*/halaman kosong (lihat §4.6).

> **Skor Backend 62/100** — fondasi baik, tertahan oleh RBAC tak ditegakkan, *service layer* tipis, *exception/observability* default, dan cakupan tes bisnis ~0.

## 4.2 React & Inertia Audit

**Component Structure & Reusability.** Baik. Komponen *reusable* (`Modal`, `MasterHero`, `FlightList`, `ConfirmDialog`, `Toast`), *layout* terpisah (`AuthenticatedLayout`, `FidsLayout`, `GuestLayout`), *custom hooks* (`useNtpClock`, `useAutoScroll`).

**State Management.** Lokal per-halaman (useState/useForm Inertia). Tidak ada *global store* — wajar untuk skala ini.

**Polling Mechanism.** `setInterval` 10 dtk + `fetch` pada layar; `WorldClockDisplay` 30 dtk untuk *settings*. **Risiko**: pada layar tertentu (mis. `PublicScreenRealtime`) digunakan `router.reload` periodik → memuat ulang *props* server (lebih berat daripada `fetch` JSON, dan rapuh terhadap kegagalan).

**Lazy Loading.** Halaman Inertia di-*resolve* via `import.meta.glob('./Pages/**/*.tsx')` (`app.tsx`) → Vite melakukan *code-splitting* per halaman (positif). Tidak ada *manual lazy* untuk komponen berat (mis. SVG *seven-segment* di `WorldClockDisplay`), namun dampaknya kecil.

**Performance / Re-render.** `WorldClockDisplay` me-*render* 60 *tick* SVG × beberapa jam setiap detik — beban CPU kecil di TV modern, namun untuk perangkat *low-end* (Android TV/stick) perlu dipantau. Layar lain ringan.

**Memory Leak.** *Interval* dibersihkan via `clearInterval` pada `useEffect` (positif, tidak ditemukan kebocoran nyata).

**UX & Responsiveness.** Tampilan *full-screen* memakai satuan `vw/vh` (cocok TV); panel admin *responsive*. Tidak ada indikator "data kedaluwarsa/last updated" di layar (rekomendasi UX keandalan).

**Rekomendasi Optimasi.**
1. Seragamkan layar ke pola **`fetch` JSON + `AbortController`** (hindari `router.reload` untuk *refresh* data display).
2. Tambah **indikator status koneksi & timestamp "diperbarui pukul ..."**.
3. Pertimbangkan `requestAnimationFrame`/`visibilitychange` *pause* saat tab tidak terlihat (irelevan untuk kiosk, relevan untuk *preview* admin).

## 4.3 API Audit — **Tingkat Risiko: TINGGI**

**REST Standard & Konsistensi Respons.** **Tidak konsisten**:
- `DisplayApiController::departures/arrivals` → `FlightResource::collection` (bentuk `{data, links, meta}`).
- `gate/checkin/baggage` → `response()->json(['data' => ...])` (bentuk *ad-hoc*).
- `TransaksiApiController` → `{data:{sukses, pesan, result:<paginator>}}` (envelope berbeda lagi).
→ Tiga gaya kontrak berbeda menyulitkan konsumen & *maintenance*.

**Pagination.** Tersedia pada `transaksi/*` (paginator standar). Endpoint display lain mengembalikan koleksi penuh (wajar untuk volume harian, tetapi tanpa batas eksplisit).

**Error Handling (API).** Mengandalkan *handler* default; 404 model binding mengembalikan 404 JSON pada konteks API (memadai), namun tidak ada *envelope error* yang seragam.

**API Security / Data Exposure.**
- Seluruh `/api/fids/*`, `/api/transaksi/*`, `GET /api/pending-announcements` bersifat **publik tanpa autentikasi**. Untuk data yang memang ditayangkan di layar publik, eksposur *read* dapat diterima, **tetapi tanpa *rate limiting*** (lihat M-01).
- **KRITIS (C-03):** `POST /api/fids/announcements/{announcement}/played` (`routes/api.php`) bersifat publik, **tanpa auth, tanpa CSRF, tanpa throttle**, dan controllernya menaikkan `broadcast_count` lalu **menghapus** pengumuman saat mencapai `max_broadcasts`. Penyerang dapat memanggil *endpoint* ini berulang untuk **memaksa penghapusan pengumuman** atau memanipulasi hitungan siaran.

**Missing Validation / Rate Limit.** Tidak ada `throttle` pada grup API (`bootstrap/app.php` tidak menambah `throttle:api`; *route* API polos). *Parameter* `{counter}`, `{gate}`, dll. di-*resolve* aman via *query builder* (tidak ada *raw SQL* dari input pengguna yang rentan injeksi — `orWhereRaw` memakai *binding* parameter, positif).

> **Tingkat Risiko API: TINGGI**, didorong oleh C-03 (mutasi/penghapusan tanpa auth) + M-01 (tanpa *rate limit*) + inkonsistensi kontrak.

## 4.4 Database Audit

**Struktur & Relasi.** Skema ternormalisasi wajar; relasi via *foreign key* `constrained()` dengan `onDelete` tepat (`cascade` untuk master wajib, `set null` untuk opsional) — **integritas referensial baik** (bukti: `create_flights_table`).

**Indexing.** *Foreign key* otomatis ter-index. **Namun belum ada index pada kolom non-FK yang paling sering difilter/diurutkan**: `tanggal_penerbangan`, `jenis_penerbangan`, `is_master`, `status`, `jam_jadwal`. *Scope* `today()/daily()/departure()/arrival()` + `whereIn('status', ...)` + `orderBy('jam_jadwal')` dipakai di hampir semua endpoint display & laporan → **risiko *full table scan*** seiring pertumbuhan tabel `flights`.

**Query Performance / N+1.** Sebagian besar kueri memakai `with([...])` (eager loading) → **N+1 termitigasi** (positif). *Transaksi* API mengambil seluruh relasi yang relevan per halaman (5 baris) → efisien.

**Data Integrity.** Enum (`jenis_penerbangan`, `tipe_layanan`, `status_counter`) menjaga domain nilai; *unique* pada `nomor_counter`, dll.

**Archiving Strategy.** Ada (`fids:archive-flights` harian + tabel `archived_flights`, `daily_reset_logs`) — **positif** untuk mengendalikan ukuran tabel operasional.

**Rekomendasi SQL (Index).**
```sql
-- Index komposit untuk kueri operasional display & laporan
CREATE INDEX idx_flights_ops
  ON flights (is_master, jenis_penerbangan, tanggal_penerbangan, jam_jadwal);

-- Filter status sering dipakai (whereIn status)
CREATE INDEX idx_flights_status ON flights (status);

-- Pencarian per nomor penerbangan (API/lookup)
CREATE INDEX idx_flights_nomor ON flights (nomor_penerbangan);

-- Log status: kueri dashboard berdasarkan waktu & flight
CREATE INDEX idx_flight_status_logs_flight ON flight_status_logs (flight_id, created_at);
```
> Validasi dampak dengan `EXPLAIN` sebelum/sesudah pada dataset produksi representatif.

## 4.5 Security Audit (OWASP Top 10:2021)

| OWASP | Temuan FIDS | Severity | Dampak | Mitigasi |
|---|---|---|---|---|
| **A01 Broken Access Control** | (1) Registrasi publik → langsung ke `/admin/dashboard` tanpa *role* (C-01). (2) RBAC tidak ditegakkan di *route* (C-02). (3) `played` *endpoint* publik bisa hapus data (C-03). | **KRITIS** | Pihak tak berwenang membuat akun & mengakses modul operasional; penghapusan pengumuman oleh anonim. | Nonaktifkan registrasi publik; terapkan `role:`/`permission:` per modul; pindahkan/lindungi *endpoint* mutasi (auth + signed + throttle). |
| **A02 Cryptographic Failures** | `.env.production` benar: `APP_DEBUG=false`, `SESSION_ENCRYPT=true`, `BCRYPT_ROUNDS=12`. `.env*` ter-*ignore* dari Git (positif). | RENDAH | — | Pastikan `APP_KEY` di-*generate* di server; TLS wajib (§7). |
| **A03 Injection** | `orWhereRaw` memakai *parameter binding*; Eloquent/Query Builder konsisten; tidak ditemukan SQL mentah dari input. *Output* React ter-*escape* default. | RENDAH | — | Pertahankan; tambah validasi tipe pada *path param* numerik. |
| **A04 Insecure Design** | Tidak ada *rate limiting* API; *endpoint* mutasi tanpa auth; *self-registration* aktif by-design. | TINGGI | DoS, manipulasi data. | *Threat modeling* untuk kanal publik; *deny-by-default*. |
| **A05 Security Misconfiguration** | `ValidatePostSize` di-*remove*; *exception handler* kosong; tidak ada *security headers* terdokumentasi. | SEDANG | Unggahan besar, kebocoran *stack trace* bila `APP_DEBUG` salah set. | Set `client_max_body_size`, *security headers* (HSTS, X-Content-Type-Options, CSP), pastikan `APP_DEBUG=false`. |
| **A06 Vulnerable & Outdated Components** | Justru memakai **versi sangat baru/bleeding-edge** (Laravel 13, Vite 8) → *peer dependency* `@vitejs/plugin-react` tidak kompatibel (ditangani via `legacy-peer-deps`). Risiko stabilitas/*supply-chain*. | SEDANG | Regresi *build*, *patch* belum matang. | Pin versi *lock*; jalankan `composer audit` & `npm audit` di CI; pertimbangkan versi LTS bila tersedia. |
| **A07 Identification & Auth Failures** | Login ada *rate limit* (`LoginRequest`, 5 percobaan) + verifikasi email + reset throttle (positif). | RENDAH–SEDANG | — | Tambah MFA untuk Super Admin (opsional). |
| **A08 Software & Data Integrity** | Tidak ada *signed endpoint* untuk aksi sensitif; tidak ada SRI/CSP. | SEDANG | — | Gunakan *signed URL* untuk aksi mesin; CSP. |
| **A09 Logging & Monitoring Failures** | Logging minim; tidak ada *alerting*/observability; *audit trail* hanya untuk status penerbangan. | TINGGI | Insiden tidak terdeteksi/terlacak. | Lihat §9 (Sentry, Pulse, *audit log* akses). |
| **A10 SSRF** | Konsumsi BMKG via URL *config* statis (bukan input pengguna). | RENDAH | — | Pertahankan *allowlist* host. |

## 4.6 Flight Display Reliability — **Lemah (perlu perbaikan)**

- **Polling**: `fetch` 10 dtk pada sebagian besar layar; pada kegagalan, *handler* hanya `console.error` dan **mempertahankan state terakhir di memori** (positif selama halaman tidak di-*reload*).
- **Risiko `router.reload`** pada `PublicScreenRealtime`: kegagalan server saat *reload* periodik dapat memunculkan *error*/kosong.
- **Tidak ada *offline mode*, *Service Worker*, atau *localStorage fallback*** → bila monitor *auto-refresh*/reboot saat API/jaringan *down*, layar **gagal menampilkan data penerbangan terakhir** (tampil *loading*/blank). Ini **tidak memenuhi persyaratan** "tetap menampilkan data terakhir saat API gagal".
- **Tidak ada *watchdog*/auto-reload** bila tab *crash*; tidak ada indikator "data kedaluwarsa".

**Wajib sebelum Go-Live (M-02):** implementasi *cache* data terakhir ke `localStorage` + render dari *cache* saat *fetch* gagal, tambahkan *banner* "Data terakhir pukul HH:MM (mode luring)", dan *watchdog* `setTimeout` untuk *self-reload* terkontrol.

---

# 5. ANALISIS RISIKO

| Kode | Risiko | Kemungkinan | Dampak | Eksposur |
|---|---|---|---|---|
| C-01 | Akun admin dibuat oleh pihak luar | Tinggi (route publik) | Kritis (akses operasional) | **Ekstrem** |
| C-02 | Eskalasi akses lintas modul tanpa RBAC | Tinggi | Kritis | **Ekstrem** |
| C-03 | Penghapusan pengumuman oleh anonim / DoS data | Sedang–Tinggi | Tinggi | **Tinggi** |
| M-01 | DoS / scraping API tanpa throttle | Sedang | Tinggi (layanan TV terganggu) | **Tinggi** |
| M-02 | Layar kosong saat API/jaringan gagal | Sedang (24/7, jaringan bandara) | Tinggi (informasi penumpang hilang) | **Tinggi** |
| M-03 | MySQL *bottleneck* skala monitor besar | Sedang | Sedang–Tinggi | **Sedang–Tinggi** |
| M-04 | Degradasi performa kueri (no index) | Sedang (tumbuh waktu) | Sedang | **Sedang** |
| M-05 | Kehilangan data tanpa backup/DR | Rendah–Sedang | Kritis | **Tinggi** |

---

# 6. MATRIKS RISIKO

```
DAMPAK →     Rendah     Sedang        Tinggi            Kritis
Kemungkinan
 Tinggi        ·          ·            M-01             C-01, C-02
 Sedang        ·         M-04          M-02, M-03, C-03 M-05
 Rendah        ·          ·             ·                ·
```
Legenda zona: **Merah (segera)** = C-01, C-02, C-03, M-01, M-02, M-05; **Kuning (terjadwal)** = M-03, M-04.

---

# 7. TEMUAN KRITIS (harus ditutup sebelum Go-Live)

### C-01 — Registrasi Pengguna Terbuka untuk Publik
**Bukti:** `routes/auth.php:14-18` (grup `guest`, `GET/POST register`); `app/Http/Controllers/Auth/RegisteredUserController@store` membuat `User` **tanpa role**, `Auth::login`, lalu `redirect(route('admin.dashboard'))`.
**Dampak:** Siapa pun di internet dapat membuat akun dan masuk ke area admin. Untuk sistem operasional bandara, ini pelanggaran *least privilege* yang serius.
**Mitigasi:**
- Nonaktifkan *route* registrasi (hapus dari `auth.php`) **atau** batasi ke admin (`auth` + `permission:manage-users`).
- Pembuatan akun hanya melalui modul **User Management** oleh Super Admin (sudah ada `UserController`).
- Pengguna baru wajib di-*assign* role eksplisit; *default* = tanpa akses.

### C-02 — RBAC Tidak Ditegakkan di Level Route
**Bukti:** `routes/web.php:83` grup admin `middleware(['auth','verified'])` saja; tidak ada `role:`/`permission:`. `FlightRequest::authorize()` `return true`. RBAC Spatie hanya dipakai sporadis di dalam *logic* (`UserController:85 hasRole('Super Admin')`).
**Dampak:** Setiap pengguna terautentikasi (termasuk hasil C-01) dapat mengakses **seluruh** modul CRUD operasional (flights, gates, counters, users, settings) tanpa pembedaan peran. Peran "Admin Operasional" vs "Super Admin" praktis tidak berfungsi sebagai kontrol akses.
**Mitigasi:**
- Terapkan *middleware* peran/izin per modul, mis.:
  ```php
  Route::resource('users', UserController::class)->middleware('role:Super Admin');
  Route::resource('flights', FlightController::class)->middleware('permission:manage-flights');
  ```
- Definisikan matriks Permission ↔ Role yang jelas; tegakkan `authorize()`/Policy pada aksi sensitif.

### C-03 — Endpoint API Publik yang Memutasi & Menghapus Data
**Bukti:** `routes/api.php` → `POST /api/fids/announcements/{announcement}/played` → `DisplayApiController@markAnnouncementPlayed` (`increment('broadcast_count')` + `delete()` saat mencapai `max_broadcasts`). Tanpa auth, tanpa CSRF (grup API), tanpa throttle.
**Dampak:** Anonim dapat memaksa penghapusan pengumuman publik atau memanipulasi penjadwalan siaran (integritas & ketersediaan informasi).
**Mitigasi (pilih sesuai arsitektur):**
- Lindungi dengan **token bersama** (header rahasia) khusus perangkat layar, **atau** *signed URL* (`URL::temporarySignedRoute`), **atau** batasi ke IP segmen monitor (allowlist) + `throttle`.
- Alternatif desain: pindahkan penghitungan siaran ke sisi server (scheduler) sehingga layar tidak perlu memutasi state; layar cukup *read-only*.
- Jangan lakukan **DELETE** dari kanal publik; ganti "selesai" → tandai `status_aktif=false` via proses terkontrol.

---

# 8. TEMUAN MAYOR

- **M-01 — Tidak ada Rate Limiting API.** Tambahkan `throttle` pada grup API (mis. `throttle:60,1` untuk display *read*; lebih ketat untuk *endpoint* mutasi). Bukti: `bootstrap/app.php` (tanpa `throttle:api`), `routes/api.php` (polos).
- **M-02 — Tidak ada Fallback Offline Layar.** Implementasi `localStorage` cache + render dari cache saat gagal + indikator mode luring + *watchdog* reload. (Lihat §4.6.)
- **M-03 — Session/Cache/Queue di MySQL & Tanpa Cache Respons.** Adopsi **Redis** untuk session/cache/queue; tambahkan *cache* respons API display (TTL 5–10 dtk) agar N monitor = 1 *hit* DB per TTL. Bukti: `.env.production` (`SESSION/CACHE/QUEUE=database`).
- **M-04 — Index Operasional Hilang.** Terapkan index pada §4.4.
- **M-05 — Backup/DR Belum Terdokumentasi.** Tetapkan strategi *backup* + RTO/RPO + SOP *restore* (Lihat §8/§ HA-DR di bawah & §11/§12).
- **M-06 — Observability Nihil.** Tidak ada *error tracking*/metrik/alert (Lihat §9).
- **M-07 — Cakupan Tes Bisnis ~0.** 10 berkas tes, mayoritas bawaan *auth* Breeze + 1 *custom*; **tidak ada tes untuk Flight/Display/API**. Risiko regresi tinggi.
- **M-08 — Single Point of Failure.** Server tunggal tanpa redundansi/HA.

---

# 9. TEMUAN MINOR

- **m-01 — Inkonsistensi kontrak API** (3 gaya envelope). Seragamkan ke satu format `{success, data, meta, error}`.
- **m-02 — Dead/duplicate route** `increment-count` (web) tak terpakai namun memutasi data. Hapus/lindungi.
- **m-03 — Exception handler kosong**; tidak ada *reporting* terpusat.
- **m-04 — Fat Controller** & duplikasi aturan validasi `store/update`. Refaktor ke *Service* + *Form Request*.
- **m-05 — `ValidatePostSize` di-remove**; kompensasi di Nginx + validasi ukuran per-unggahan.
- **m-06 — S3 (flysystem) terpasang namun `FILESYSTEM_DISK=local`**; media (logo, idle image, iklan) di disk lokal → menyulitkan *multi-node*/backup. Pertimbangkan S3/MinIO bila HA.
- **m-07 — Tidak ada indikator "last updated"/status koneksi** pada layar publik (UX keandalan).
- **m-08 — `WorldClockDisplay`** me-*render* banyak elemen SVG per detik; pantau pada perangkat TV *low-end*.

---

# 10. REKOMENDASI TEKNIS

## 10.1 Keamanan (Prioritas 1)
1. **Matikan registrasi publik**; pembuatan akun hanya via User Management (Super Admin).
2. **Tegakkan RBAC per modul** (`role:`/`permission:` + Policy) sesuai matriks peran.
3. **Amankan endpoint mutasi API** (token/signed/IP allowlist + throttle); hilangkan DELETE dari kanal publik.
4. **Rate limiting** seluruh API; **security headers** (HSTS, CSP, X-Content-Type-Options, X-Frame-Options) via Nginx/middleware.
5. **MFA** untuk Super Admin (opsional, direkomendasikan).
6. CI: `composer audit` + `npm audit` + Pint + analisis statis (Larastan/PHPStan).

## 10.2 Performa & Skalabilitas (Prioritas 2)
1. **Redis** untuk session/cache/queue.
2. **Cache respons API display** (TTL pendek) + `php artisan optimize` (route/config/view cache) + OPcache.
3. **Index DB** (§4.4) + `EXPLAIN` rutin.
4. Pindahkan logika domain ke **Service Layer**; manfaatkan **Queue** untuk pekerjaan asinkron (mis. *fetch* cuaca, *export* PDF besar).

## 10.3 Keandalan Layar (Prioritas 1–2)
1. **Offline-first**: cache `localStorage`, render dari cache saat gagal, indikator mode luring, *watchdog* reload.
2. Seragamkan ke **`fetch` + AbortController** (hindari `router.reload` untuk data display).
3. *Health monitor* per layar + auto-recovery.

## 10.4 Observability (Prioritas 2)
- **Sentry** (error tracking PHP + JS), **Laravel Pulse** (performa aplikasi), **Prometheus + Grafana** (infra: CPU/RAM/MySQL/Nginx), **Alertmanager/Telegram** untuk *alerting*. **Audit log** akses & perubahan data sensitif.

---

# 11. INFRASTRUKTUR & PERFORMA (Sizing)

## 11.1 Komponen Produksi yang Direkomendasikan
Ubuntu Server LTS 22.04/24.04, **Nginx** (reverse proxy + TLS + `client_max_body_size` + security headers), **PHP-FPM 8.3** (OPcache, *pool* terukur), **MySQL 8** (atau MariaDB), **Redis** (session/cache/queue), **Supervisor** (queue worker + jika perlu *horizon*), **Certbot/SSL**, **cron** (`schedule:run`).

## 11.2 Spesifikasi Minimum & Rekomendasi

| Profil | vCPU | RAM | Disk | Keterangan |
|---|---|---|---|---|
| **Minimum (≤25 monitor)** | 2 | 4 GB | 50 GB SSD | App+DB+Redis satu node (belum HA) |
| **Rekomendasi (≤50 monitor)** | 4 | 8 GB | 80 GB SSD | App+Redis satu node, **MySQL terpisah** |
| **Produksi 24/7 (≤100 monitor, HA)** | 4–8 (App) + 4 (DB) | 8–16 GB | 100 GB SSD + backup | 2× App di belakang LB, MySQL primary/replica, Redis |

## 11.3 Estimasi Beban (Capacity Modeling — analitis)
Asumsi: tiap monitor melakukan ~1–2 permintaan API / 10 dtk (6–12 req/menit); respons JSON rata-rata ~20 KB.

| Monitor | Req/menit | Req/detik | Bandwidth (≈) | Beban DB (tanpa cache) | Beban DB (dengan cache TTL 10s) |
|---|---|---|---|---|---|
| 10 | 60–120 | 1–2 | ~0.3 Mbps | rendah | sangat rendah |
| 25 | 150–300 | 3–5 | ~0.8 Mbps | sedang | rendah |
| 50 | 300–600 | 5–10 | ~1.6 Mbps | tinggi | rendah |
| 100 | 600–1200 | 10–20 | ~3.2 Mbps | **sangat tinggi (bottleneck)** | rendah–sedang |

**Kesimpulan sizing:** *Bandwidth* bukan kendala utama (LAN). **Beban DB** adalah faktor pembatas. **Dengan *caching* respons (Redis, TTL 5–10 dtk), 100 monitor runtuh menjadi ~1 kueri DB per endpoint per TTL** — *scaling* menjadi mudah secara horizontal pada lapisan App. **Tanpa caching**, 100 monitor berisiko menjenuhkan MySQL (apalagi session/cache juga di MySQL). **Rekomendasi scaling:** Redis cache + 2× App node + LB untuk ≥50 monitor; MySQL *read replica* opsional untuk laporan.

---

# 11A. HIGH AVAILABILITY & DISASTER RECOVERY

## Strategi Backup
- **Database:** `mysqldump` harian (retensi 7–30 hari) **+ binlog** untuk *point-in-time recovery*. Simpan *offsite* (S3/MinIO/NAS).
- **Media:** *backup* `storage/app/public` (logo, idle image, iklan) harian; idealnya pindah ke S3/MinIO.
- **Konfigurasi:** simpan `.env` produksi di *secret manager*/brankas terenkripsi (jangan di repo).

## RTO / RPO (Target Disarankan)
| Metrik | Kondisi Saat Ini | Target Produksi |
|---|---|---|
| **RPO** | Tidak terdefinisi (tanpa backup otomatis) → potensi kehilangan data hingga hari terakhir manual | **≤ 15 menit** (binlog) / minimal **≤ 24 jam** (dump harian) |
| **RTO** | ~1–2 jam (rebuild manual via `deploy.sh` + restore) | **≤ 30–60 menit** dengan SOP + *warm standby* |

## SOP Recovery (ringkas)
1. **Deteksi & deklarasi insiden** (monitoring/alert).
2. **Provision** node pengganti (image/IaC) → jalankan `deploy.sh`.
3. **Restore DB**: dump terbaru → `mysql < backup.sql`, lalu *apply* binlog s.d. titik kegagalan.
4. **Restore media** dari *backup*/S3 → `php artisan storage:link`.
5. **Validasi**: `/up` health, login admin, render layar `/public/screen`, integritas data penerbangan H-ini.
6. **Switch DNS/LB** ke node baru; **post-mortem**.

## Business Continuity
- Mode **degradasi**: layar wajib menampilkan **data terakhir** (M-02) saat backend *down*.
- *Runbook* tercetak di ruang operasi; kontak eskalasi; jadwal *drill* DR ≥ 2×/tahun.

---

# 12. ROADMAP PERBAIKAN

| Fase | Target Waktu | Lingkup |
|---|---|---|
| **Fase 0 — Blocker Go-Live** | Minggu 1 | C-01, C-02, C-03, M-02 (offline layar), M-05 (backup minimal harian) |
| **Fase 1 — Hardening** | Minggu 2–3 | M-01 (throttle), security headers, M-04 (index), Redis (M-03), observability dasar (Sentry) |
| **Fase 2 — Skalabilitas & Kualitas** | Minggu 4–6 | Cache respons API, Service Layer refactor, Queue, tes bisnis (M-07), Pulse/Grafana |
| **Fase 3 — HA & DR Penuh** | Minggu 7–10 | 2× App + LB, MySQL replica, S3/MinIO media, *DR drill*, dokumentasi runbook lengkap |

---

# 13. CHECKLIST GO-LIVE

**Keamanan**
- [ ] Registrasi publik dinonaktifkan / dibatasi admin (C-01)
- [ ] RBAC ditegakkan per modul + Policy (C-02)
- [ ] Endpoint API mutasi diamankan (token/signed/IP) + tanpa DELETE publik (C-03)
- [ ] Rate limiting API aktif (M-01)
- [ ] Security headers (HSTS/CSP/XCTO/XFO) + TLS valid
- [ ] `APP_DEBUG=false`, `APP_KEY` ter-generate, `.env` di luar repo

**Keandalan & Performa**
- [ ] Fallback offline + indikator data terakhir pada layar (M-02)
- [ ] Redis aktif (session/cache/queue) (M-03)
- [ ] Cache respons API display (TTL pendek)
- [ ] Index DB operasional terpasang & diverifikasi `EXPLAIN` (M-04)
- [ ] `php artisan optimize` + OPcache aktif

**Operasional**
- [ ] Cron `schedule:run` aktif; Supervisor queue worker berjalan
- [ ] Backup harian DB + media tervalidasi (restore test) (M-05)
- [ ] RTO/RPO disepakati & SOP recovery diuji (drill)
- [ ] Monitoring + alerting (Sentry/Pulse/Grafana) aktif (M-06)
- [ ] Health check `/up` dipantau LB/uptime monitor

**Kualitas**
- [ ] Tes untuk modul kritis (Flight/Display/API) (M-07)
- [ ] CI: audit dependency + analisis statis + Pint
- [ ] Dokumentasi runbook & arsitektur final

---

# 14. KESIMPULAN & PRODUCTION READINESS SCORE

## 14.1 Kesimpulan
FIDS APT Pranoto adalah aplikasi dengan **fondasi teknik yang solid dan rapi**, fitur fungsional lengkap, serta praktik dasar yang benar (eager loading, integritas FK, scheduler, login throttle, konfigurasi produksi dasar yang aman). Namun untuk **sertifikasi Go-Live pada lingkungan operasional bandara 24/7**, terdapat **tiga temuan KRITIS pada kontrol akses** dan **beberapa temuan MAYOR pada keandalan layar, skalabilitas, basis data, backup/DR, dan observability** yang **harus** diselesaikan terlebih dahulu.

Sistem **belum layak Go-Live** pada kondisi saat ini, namun **dapat mencapai status Siap Produksi (Grade B) dalam ~2–3 minggu** dengan menutup Fase 0–1 pada roadmap.

## 14.2 Skor Kesiapan Produksi

| Dimensi | Bobot | Skor (0–100) | Tertimbang |
|---|---|---|---|
| Security | 25% | 45 | 11.25 |
| Reliability | 20% | 55 | 11.00 |
| Performance | 15% | 60 | 9.00 |
| Scalability | 15% | 50 | 7.50 |
| Maintainability | 10% | 65 | 6.50 |
| Compliance (RBAC/Audit/Retention) | 10% | 50 | 5.00 |
| Documentation | 5% | 55 | 2.75 |
| **TOTAL** | **100%** | | **≈ 53.0** |

> ## NILAI AKHIR: **53 / 100 → GRADE D (Perlu Perbaikan Mayor)**
>
> **Proyeksi pasca-perbaikan:** menutup C-01, C-02, C-03 (Security → ~75), M-02 (Reliability → ~75), M-03/M-04 (Performance/Scalability → ~75), dan M-05/M-06 → estimasi skor **78–82 → Grade B (Siap Produksi)**.

## 14.3 Pernyataan Auditor
Berdasarkan bukti yang diperiksa, **Tim Audit TI Independen merekomendasikan PENUNDAAN Go-Live** hingga seluruh **Temuan KRITIS (Fase 0)** ditutup dan diverifikasi ulang melalui *re-audit* terbatas. Setelah verifikasi penutupan Fase 0–1, sistem dinilai layak naik ke **Grade B** dan dapat dideklarasikan **Siap Produksi** dengan pemantauan ketat selama periode *hypercare* (2–4 minggu pertama).

---

*Akhir Laporan — Dokumen ini bersifat penilaian teknis independen dan tidak menggantikan uji penetrasi aktif maupun load test produksi yang disarankan sebagai tindak lanjut.*
