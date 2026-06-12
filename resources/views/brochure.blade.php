<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>FIDS - Flight Information Display System</title>
    <style>
        @page { margin: 0; size: A4 landscape; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; line-height: 1.4; }

        .page { width: 297mm; height: 210mm; position: relative; overflow: hidden; page-break-after: always; }
        .page:last-child { page-break-after: auto; }

        /* Page 1 - Cover */
        .cover { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0d1b2a 100%); color: white; display: flex; align-items: center; justify-content: center; }
        .cover-content { text-align: center; padding: 40px; }
        .cover h1 { font-size: 52px; font-weight: 900; letter-spacing: -1px; margin-bottom: 8px; }
        .cover .subtitle { font-size: 18px; color: rgba(255,255,255,0.7); font-weight: 400; margin-bottom: 30px; }
        .cover .tagline { font-size: 14px; color: rgba(255,255,255,0.5); letter-spacing: 3px; text-transform: uppercase; margin-bottom: 40px; }
        .cover .features-row { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }
        .cover .feature-chip { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); padding: 8px 18px; border-radius: 20px; font-size: 12px; color: rgba(255,255,255,0.8); }
        .cover .airport-name { font-size: 16px; color: #60a5fa; margin-top: 40px; font-weight: 600; }
        .logo-circle { width: 100px; height: 100px; border-radius: 50%; background: rgba(59,130,246,0.2); border: 2px solid rgba(59,130,246,0.5); display: flex; align-items: center; justify-content: center; margin: 0 auto 30px; }
        .logo-circle span { font-size: 36px; }

        /* Page 2 - Overview */
        .page-inner { padding: 30px 40px; height: 100%; display: flex; flex-direction: column; }
        .page-header { border-bottom: 3px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        .page-header h2 { font-size: 24px; color: #0f172a; font-weight: 800; }
        .page-header .badge { background: #3b82f6; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; }
        .section-title { font-size: 16px; font-weight: 700; color: #1e40af; margin-bottom: 8px; margin-top: 16px; }
        .text-muted { color: #64748b; font-size: 12px; }
        .text-body { font-size: 13px; color: #374151; line-height: 1.6; }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }

        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
        .card-blue { background: linear-gradient(135deg, #eff6ff, #dbeafe); border-color: #bfdbfe; }
        .card-green { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-color: #bbf7d0; }
        .card-purple { background: linear-gradient(135deg, #faf5ff, #f3e8ff); border-color: #e9d5ff; }
        .card-amber { background: linear-gradient(135deg, #fffbeb, #fef3c7); border-color: #fde68a; }
        .card-red { background: linear-gradient(135deg, #fef2f2, #fee2e2); border-color: #fecaca; }
        .card h4 { font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
        .card p { font-size: 11px; color: #64748b; line-height: 1.5; }
        .card .icon { font-size: 24px; margin-bottom: 8px; }

        .feature-list { list-style: none; padding: 0; }
        .feature-list li { padding: 6px 0; font-size: 12px; color: #374151; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 8px; }
        .feature-list li:last-child { border-bottom: none; }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; flex-shrink: 0; }
        .dot-green { background: #10b981; }
        .dot-purple { background: #8b5cf6; }
        .dot-red { background: #ef4444; }

        .stat-box { text-align: center; padding: 12px; }
        .stat-box .number { font-size: 28px; font-weight: 900; color: #1e40af; }
        .stat-box .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }

        .footer { margin-top: auto; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .footer span { font-size: 10px; color: #94a3b8; }
    </style>
</head>
<body>

<!-- PAGE 1: COVER -->
<div class="page cover">
    <div class="cover-content">
        <div class="logo-circle"><span>✈</span></div>
        <h1>FIDS</h1>
        <p class="subtitle">Flight Information Display System</p>
        <p class="tagline">Sistem Informasi Penerbangan Bandara Terintegrasi</p>
        <div class="features-row">
            <span class="feature-chip">Real-time Display</span>
            <span class="feature-chip">NTP Synchronized</span>
            <span class="feature-chip">Multi-Screen</span>
            <span class="feature-chip">Auto Scheduling</span>
            <span class="feature-chip">World Clock</span>
            <span class="feature-chip">CCTV Integration</span>
        </div>
        <p class="airport-name">{{ $nama_bandara ?? 'Airport Flight Information System' }}</p>
    </div>
</div>

<!-- PAGE 2: TENTANG SISTEM -->
<div class="page">
    <div class="page-inner">
        <div class="page-header">
            <h2>Tentang Sistem FIDS</h2>
            <span class="badge">Overview</span>
        </div>

        <p class="text-body" style="margin-bottom: 16px;">
            FIDS (Flight Information Display System) adalah sistem terintegrasi untuk menampilkan informasi penerbangan
            secara real-time di seluruh area bandara. Dirancang untuk kebutuhan operasional bandara Indonesia dengan
            dukungan multi-zona waktu, sinkronisasi NTP, dan tampilan modern untuk TV monitor.
        </p>

        <div class="grid-2">
            <div>
                <p class="section-title">Keunggulan Utama</p>
                <ul class="feature-list">
                    <li><span class="dot"></span>Tampilan real-time dengan sinkronisasi NTP Server</li>
                    <li><span class="dot"></span>Multi-layar: Departure, Arrival, Gate, Check-in, Baggage</li>
                    <li><span class="dot"></span>World Clock Display (UTC, WIB, WITA, WIT)</li>
                    <li><span class="dot"></span>Integrasi CCTV area bagasi</li>
                    <li><span class="dot"></span>Public Announcement System dengan audio</li>
                    <li><span class="dot"></span>Advertisement Management untuk monetisasi</li>
                    <li><span class="dot"></span>Auto-generate jadwal harian dari master schedule</li>
                    <li><span class="dot"></span>Cuaca real-time dari BMKG</li>
                    <li><span class="dot"></span>Multi-bahasa (Indonesia & English)</li>
                    <li><span class="dot"></span>Dashboard admin yang komprehensif</li>
                </ul>
            </div>
            <div>
                <p class="section-title">Spesifikasi Teknis</p>
                <ul class="feature-list">
                    <li><span class="dot dot-purple"></span>Laravel 13 + Inertia.js + React + TypeScript</li>
                    <li><span class="dot dot-purple"></span>Tailwind CSS 3 + Responsive Design</li>
                    <li><span class="dot dot-purple"></span>NTP Time Synchronization (SNTP Protocol)</li>
                    <li><span class="dot dot-purple"></span>REST API untuk semua display</li>
                    <li><span class="dot dot-purple"></span>Auto-refresh setiap 10-15 detik</li>
                    <li><span class="dot dot-purple"></span>Seven-Segment Digital Clock Display</li>
                    <li><span class="dot dot-purple"></span>SVG Animated Ring Timer</li>
                    <li><span class="dot dot-purple"></span>Support TV Monitor Full-screen</li>
                    <li><span class="dot dot-purple"></span>PDF Report Export (DomPDF)</li>
                    <li><span class="dot dot-purple"></span>Role-based Access Control</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <span>FIDS - Flight Information Display System</span>
            <span>Halaman 2</span>
        </div>
    </div>
</div>

<!-- PAGE 3: FITUR LAYAR MONITOR -->
<div class="page">
    <div class="page-inner">
        <div class="page-header">
            <h2>Layar Monitor TV</h2>
            <span class="badge">Display Screens</span>
        </div>

        <p class="text-body" style="margin-bottom: 16px;">
            Sistem menyediakan berbagai jenis tampilan layar yang dapat dipasang di TV monitor area bandara.
            Setiap layar beroperasi secara independen, auto-refresh, dan dapat dikustomisasi melalui panel admin.
        </p>

        <div class="grid-4">
            <div class="card card-blue">
                <div class="icon">🛫</div>
                <h4>Keberangkatan</h4>
                <p>Jadwal penerbangan berangkat dengan status real-time, gate, dan check-in counter.</p>
            </div>
            <div class="card card-green">
                <div class="icon">🛬</div>
                <h4>Kedatangan</h4>
                <p>Jadwal penerbangan tiba dengan status, baggage belt, dan estimasi waktu.</p>
            </div>
            <div class="card card-purple">
                <div class="icon">🚪</div>
                <h4>Boarding Gate</h4>
                <p>Informasi per gate: penerbangan aktif, maskapai, status boarding.</p>
            </div>
            <div class="card card-amber">
                <div class="icon">🎫</div>
                <h4>Check-in Counter</h4>
                <p>Status setiap counter: maskapai, penerbangan, jam buka/tutup.</p>
            </div>
            <div class="card card-red">
                <div class="icon">🧳</div>
                <h4>Baggage Claim</h4>
                <p>Informasi belt bagasi aktif dengan penerbangan terkait.</p>
            </div>
            <div class="card card-blue">
                <div class="icon">🌐</div>
                <h4>World Clock</h4>
                <p>Jam dunia (UTC, WIB, WITA, WIT) dengan seven-segment dan ring animasi.</p>
            </div>
            <div class="card card-green">
                <div class="icon">📺</div>
                <h4>All-in-One Screen</h4>
                <p>Tampilan terpadu: departure + arrival + cuaca + jam + iklan.</p>
            </div>
            <div class="card card-purple">
                <div class="icon">📹</div>
                <h4>CCTV Bagasi</h4>
                <p>Live streaming CCTV area bagasi dengan overlay info penerbangan.</p>
            </div>
        </div>

        <div style="margin-top: 16px;">
            <div class="grid-3">
                <div class="card">
                    <h4>📢 Public Announcement</h4>
                    <p>Sistem pengumuman audio otomatis dengan scheduling dan pemutaran berulang.</p>
                </div>
                <div class="card">
                    <h4>📊 Advertisement</h4>
                    <p>Manajemen iklan multimedia (gambar/video) dengan rotasi otomatis dan durasi kustom.</p>
                </div>
                <div class="card">
                    <h4>🎯 Single Display</h4>
                    <p>Layar dedicated per gate/counter/belt — pasang 1 TV per lokasi fisik.</p>
                </div>
            </div>
        </div>

        <div class="footer">
            <span>FIDS - Flight Information Display System</span>
            <span>Halaman 3</span>
        </div>
    </div>
</div>

<!-- PAGE 4: PANEL ADMIN -->
<div class="page">
    <div class="page-inner">
        <div class="page-header">
            <h2>Panel Administrasi</h2>
            <span class="badge">Admin Features</span>
        </div>

        <p class="text-body" style="margin-bottom: 16px;">
            Panel admin yang komprehensif memungkinkan operator mengelola seluruh operasional penerbangan
            dari satu dashboard. Interface modern dan responsif dengan dark mode support.
        </p>

        <div class="grid-2">
            <div>
                <p class="section-title">Operasional Harian</p>
                <ul class="feature-list">
                    <li><span class="dot"></span>Keberangkatan Hari Ini — kelola status & gate real-time</li>
                    <li><span class="dot"></span>Kedatangan Hari Ini — update status & baggage belt</li>
                    <li><span class="dot"></span>Tarik dari Master — generate jadwal harian otomatis</li>
                    <li><span class="dot"></span>Update status: Scheduled → Boarding → Departed</li>
                    <li><span class="dot"></span>Auto-refresh setiap 5 menit + reset jam 01:00</li>
                </ul>

                <p class="section-title">Data Master</p>
                <ul class="feature-list">
                    <li><span class="dot dot-green"></span>Maskapai (logo, warna identitas)</li>
                    <li><span class="dot dot-green"></span>Bandara (kode IATA, kota)</li>
                    <li><span class="dot dot-green"></span>Rute Penerbangan</li>
                    <li><span class="dot dot-green"></span>Pesawat (tipe, kapasitas)</li>
                    <li><span class="dot dot-green"></span>Gate, Counter, Belt</li>
                    <li><span class="dot dot-green"></span>Remark & Reason</li>
                </ul>
            </div>
            <div>
                <p class="section-title">Pengaturan Sistem</p>
                <ul class="feature-list">
                    <li><span class="dot dot-red"></span>Pengaturan Layar FIDS (logo, background, bahasa, timezone)</li>
                    <li><span class="dot dot-red"></span>Pengaturan TV Layar Publik (layout, warna, toggle section)</li>
                    <li><span class="dot dot-red"></span>Pengaturan NTP Server (3 server, auto-sync, riwayat)</li>
                    <li><span class="dot dot-red"></span>World Clock Display (zona, format, tema, animasi)</li>
                    <li><span class="dot dot-red"></span>Advertisement Management (upload, order, durasi)</li>
                    <li><span class="dot dot-red"></span>CCTV Camera Management</li>
                </ul>

                <p class="section-title">Laporan & Export</p>
                <ul class="feature-list">
                    <li><span class="dot dot-purple"></span>Laporan Keberangkatan (filter tanggal, PDF export)</li>
                    <li><span class="dot dot-purple"></span>Laporan Kedatangan (filter tanggal, PDF export)</li>
                    <li><span class="dot dot-purple"></span>Dashboard statistik (flight per hari, status, maskapai)</li>
                    <li><span class="dot dot-purple"></span>Flight Status Log (riwayat perubahan status)</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <span>FIDS - Flight Information Display System</span>
            <span>Halaman 4</span>
        </div>
    </div>
</div>

<!-- PAGE 5: NTP & WORLD CLOCK -->
<div class="page">
    <div class="page-inner">
        <div class="page-header">
            <h2>Sinkronisasi Waktu & World Clock</h2>
            <span class="badge">NTP System</span>
        </div>

        <div class="grid-2">
            <div>
                <p class="section-title">NTP Time Synchronization</p>
                <p class="text-body" style="margin-bottom: 12px;">
                    Waktu adalah elemen krusial di bandara. Sistem FIDS menggunakan protokol SNTP untuk
                    sinkronisasi waktu dengan server NTP, memastikan semua layar menampilkan waktu yang akurat.
                </p>

                <div class="card card-blue" style="margin-bottom: 12px;">
                    <h4>Cara Kerja</h4>
                    <p>1. Server backend query NTP via UDP port 123<br>
                       2. Hitung offset antara server lokal dan NTP<br>
                       3. Frontend fetch /api/fids/time setiap 60 detik<br>
                       4. Semua display menggunakan waktu terkoreksi</p>
                </div>

                <div class="card">
                    <h4>Fitur NTP</h4>
                    <ul class="feature-list">
                        <li><span class="dot"></span>3 server NTP (utama + 2 cadangan)</li>
                        <li><span class="dot"></span>Auto-fallback jika server gagal</li>
                        <li><span class="dot"></span>Riwayat 20 sinkronisasi terakhir</li>
                        <li><span class="dot"></span>Tampilkan offset & network delay</li>
                        <li><span class="dot"></span>Sync manual dari panel admin</li>
                    </ul>
                </div>
            </div>
            <div>
                <p class="section-title">World Clock Display</p>
                <p class="text-body" style="margin-bottom: 12px;">
                    Layar khusus menampilkan jam dunia dengan desain modern untuk TV monitor area publik bandara.
                </p>

                <div class="card card-purple" style="margin-bottom: 12px;">
                    <h4>Fitur World Clock</h4>
                    <ul class="feature-list">
                        <li><span class="dot dot-purple"></span>4 zona: UTC, WIB, WITA, WIT</li>
                        <li><span class="dot dot-purple"></span>Seven-Segment LED Display (merah)</li>
                        <li><span class="dot dot-purple"></span>Animated ring timer (60 detik)</li>
                        <li><span class="dot dot-purple"></span>Glowing dot berputar real-time</li>
                        <li><span class="dot dot-purple"></span>20 pilihan warna background</li>
                        <li><span class="dot dot-purple"></span>20 pilihan warna aksen</li>
                        <li><span class="dot dot-purple"></span>Support background image dari FIDS</li>
                        <li><span class="dot dot-purple"></span>Status NTP (synced/local)</li>
                    </ul>
                </div>

                <div class="card card-amber">
                    <h4>Zona Waktu Indonesia</h4>
                    <p style="font-size: 12px; line-height: 1.8;">
                        <strong>WIB</strong> — UTC+7 (Jakarta, Medan, Surabaya)<br>
                        <strong>WITA</strong> — UTC+8 (Makassar, Balikpapan, Bali)<br>
                        <strong>WIT</strong> — UTC+9 (Jayapura, Ambon, Manokwari)
                    </p>
                </div>
            </div>
        </div>

        <div class="footer">
            <span>FIDS - Flight Information Display System</span>
            <span>Halaman 5</span>
        </div>
    </div>
</div>

<!-- PAGE 6: ARSITEKTUR & PENUTUP -->
<div class="page">
    <div class="page-inner">
        <div class="page-header">
            <h2>Arsitektur & Deployment</h2>
            <span class="badge">Technical</span>
        </div>

        <div class="grid-2" style="margin-bottom: 20px;">
            <div>
                <p class="section-title">Technology Stack</p>
                <div class="grid-2" style="gap: 8px;">
                    <div class="card"><h4>Backend</h4><p>PHP 8.4 + Laravel 13</p></div>
                    <div class="card"><h4>Frontend</h4><p>React 18 + TypeScript</p></div>
                    <div class="card"><h4>Bridge</h4><p>Inertia.js v2</p></div>
                    <div class="card"><h4>Styling</h4><p>Tailwind CSS 3</p></div>
                    <div class="card"><h4>Build</h4><p>Vite 8</p></div>
                    <div class="card"><h4>PDF</h4><p>DomPDF</p></div>
                </div>
            </div>
            <div>
                <p class="section-title">Kebutuhan Infrastruktur</p>
                <ul class="feature-list">
                    <li><span class="dot"></span>Server: PHP 8.3+, MySQL/MariaDB</li>
                    <li><span class="dot"></span>TV Monitor: Browser modern (Chrome/Edge)</li>
                    <li><span class="dot"></span>Jaringan: LAN internal bandara</li>
                    <li><span class="dot"></span>NTP: Akses ke port UDP 123 (internet)</li>
                    <li><span class="dot"></span>Storage: Untuk logo, background, iklan</li>
                    <li><span class="dot"></span>Optional: Queue worker untuk announcement</li>
                </ul>

                <p class="section-title" style="margin-top: 12px;">Deployment</p>
                <ul class="feature-list">
                    <li><span class="dot dot-green"></span>Single server deployment</li>
                    <li><span class="dot dot-green"></span>Tidak perlu internet untuk operasi (kecuali NTP & BMKG)</li>
                    <li><span class="dot dot-green"></span>Auto-start via scheduler (cron)</li>
                    <li><span class="dot dot-green"></span>Zero downtime — TV auto-reconnect</li>
                </ul>
            </div>
        </div>

        <div style="background: linear-gradient(135deg, #0f172a, #1e3a5f); border-radius: 16px; padding: 24px; color: white; text-align: center;">
            <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 6px;">Siap Digunakan</h3>
            <p style="font-size: 12px; color: rgba(255,255,255,0.7); margin-bottom: 16px;">
                Sistem FIDS siap dioperasikan untuk bandara Anda. Mendukung semua tipe bandara di Indonesia.
            </p>
            <div style="display: flex; justify-content: center; gap: 30px;">
                <div class="stat-box">
                    <div class="number" style="color: #60a5fa;">12+</div>
                    <div class="label" style="color: rgba(255,255,255,0.5);">Jenis Layar</div>
                </div>
                <div class="stat-box">
                    <div class="number" style="color: #34d399;">4</div>
                    <div class="label" style="color: rgba(255,255,255,0.5);">Zona Waktu</div>
                </div>
                <div class="stat-box">
                    <div class="number" style="color: #f472b6;">24/7</div>
                    <div class="label" style="color: rgba(255,255,255,0.5);">Operasi</div>
                </div>
                <div class="stat-box">
                    <div class="number" style="color: #fbbf24;">∞</div>
                    <div class="label" style="color: rgba(255,255,255,0.5);">TV Monitor</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <span>FIDS - Flight Information Display System</span>
            <span>Halaman 6</span>
        </div>
    </div>
</div>

</body>
</html>
