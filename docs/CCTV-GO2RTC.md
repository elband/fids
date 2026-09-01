# CCTV Baggage Claim — Pemasangan go2rtc di Server

Browser tidak bisa memutar RTSP. Kamera CCTV/NVR umumnya hanya menyediakan
RTSP, jadi diperlukan satu gerbang yang menarik RTSP lalu menyajikannya ulang
sebagai WebRTC / MJPEG / HLS. Dokumen ini memakai **go2rtc** untuk peran itu.

```
Kamera/NVR ──RTSP──> VM go2rtc (port 1984) ──WebRTC/MJPEG──> Layar TV (browser)
                          ▲
                          └── URL-nya diisi di admin FIDS → CCTV Cameras
```

**Topologi yang dipakai: go2rtc berada di VM sendiri, terpisah dari server
FIDS.** Transcoding dan fan-out stream itu yang memakan CPU, bukan Laravel-nya,
jadi memisahkannya menjaga server aplikasi tetap ringan dan membuat go2rtc bisa
di-restart tanpa menyentuh FIDS sama sekali.

Konsekuensinya: server FIDS **tidak** pernah menghubungi go2rtc. Yang menarik
stream adalah browser di TV, memakai URL yang Anda simpan di database. Jadi
yang harus punya jalur jaringan ke VM go2rtc adalah **TV**, bukan server
aplikasi.

Bila go2rtc mati, halaman CCTV tetap terbuka; tile-nya jatuh ke slide iklan
seperti saat belt sedang kosong.

## 1. Pasang di VM go2rtc

Lewati bagian ini bila VM Anda sudah menjalankan go2rtc — lanjut ke langkah 2.

Skrip di bawah dijalankan **di VM go2rtc**, bukan di server aplikasi. Salin
`scripts/install-go2rtc.sh` ke VM tersebut lalu:

```bash
sudo ./install-go2rtc.sh
```

Skrip akan mengunduh biner sesuai arsitektur, membuat user sistem `go2rtc`,
menulis `/etc/go2rtc/go2rtc.yaml`, memasang service systemd, lalu
mengaktifkannya saat boot.

Skrip ini idempoten — menjalankannya lagi memutakhirkan biner dan **tidak
pernah** menimpa config yang sudah berisi kredensial kamera. Untuk mengunci
versi (disarankan di produksi):

```bash
sudo GO2RTC_VERSION=v1.9.4 ./scripts/install-go2rtc.sh
```

## 2. Daftarkan kamera

```bash
sudo nano /etc/go2rtc/go2rtc.yaml
sudo systemctl restart go2rtc
```

```yaml
streams:
  belt_b1: rtsp://admin:sandi@192.168.1.64:554/Streaming/Channels/101
  belt_b2: rtsp://admin:sandi@192.168.1.65:554/Streaming/Channels/101
```

Path RTSP berbeda per merek:

| Merek | Path RTSP |
|---|---|
| Hikvision | `/Streaming/Channels/101` (101 = kanal 1 utama, 102 = substream) |
| Dahua | `/cam/realmonitor?channel=1&subtype=0` |
| Uniview | `/media/video1` |

Untuk layar signage, **substream** (resolusi lebih rendah) biasanya lebih
tepat daripada main stream: bebannya jauh lebih ringan dan tile di layar
memang tidak sebesar itu.

Pastikan tiap kamera tampil hijau di web UI `http://IP-SERVER:1984` sebelum
lanjut.

## 3. Isi di admin FIDS

Menu **CCTV Cameras** → tambah/edit kamera:

| Kolom | Nilai |
|---|---|
| Jenis Stream | `iframe` (WebRTC, paling halus) atau `mjpeg` (paling kompatibel) |
| URL Stream (iframe) | `http://IP-SERVER:1984/stream.html?src=belt_b1&mode=webrtc` |
| URL Stream (mjpeg) | `http://IP-SERVER:1984/api/stream.mjpeg?src=belt_b1` |
| Grup | `baggage` |
| Belt | belt yang sesuai (mis. B1) |

Gunakan **IP VM go2rtc**, bukan `localhost` atau IP server FIDS — yang
menarik stream adalah browser TV, bukan aplikasinya.

## 4. Firewall dan rute antar-subnet

Di VM go2rtc:

```bash
sudo ufw allow 1984/tcp   # web UI + endpoint stream
sudo ufw allow 8555       # sinyal WebRTC (TCP & UDP)
```

Port 8555 hanya perlu bila memakai mode `webrtc`. Mode `mjpeg` cukup 1984.

Karena go2rtc terpisah, biasanya ada dua segmen jaringan yang harus tembus:

| Dari | Ke | Port | Untuk |
|---|---|---|---|
| VM go2rtc | Kamera/NVR | 554 | menarik RTSP |
| TV ruang kedatangan | VM go2rtc | 1984 (+8555) | menampilkan stream |

Uji dari TV-nya langsung — buka `http://IP-VM-GO2RTC:1984` di browser TV
tersebut. Kalau web UI-nya tidak terbuka di situ, tidak ada konfigurasi di FIDS
yang bisa menolong.

## Kapan gambar muncul di layar

Stream yang benar saja belum membuat CCTV tampil. Halaman baggage claim
sengaja hanya menyalakan kamera saat beltnya betul-betul dipakai:

- ada penerbangan **arrival hari ini**,
- `baggage_claim_id`-nya menunjuk belt kamera tersebut,
- statusnya `Landed`, `Arrived`, atau `Baggage Claim`.

Di luar itu tile menampilkan iklan atau layar Standby. Jadi bila stream sudah
hijau di go2rtc tapi layar TV tetap menampilkan iklan, periksa data
penerbangan lebih dulu — bukan konfigurasi streamnya.

Jendela waktu tampilnya diatur di **Pengaturan Layar FIDS** (menit mulai dan
menit berhenti setelah pesawat tiba).

## Pemeriksaan saat bermasalah

```bash
systemctl status go2rtc
journalctl -u go2rtc -n 50 --no-pager
curl -I http://127.0.0.1:1984/
```

| Gejala | Penyebab yang biasa |
|---|---|
| Kotak hitam, tidak ada error | URL YouTube/stream tidak bisa di-iframe, atau `src=` salah nama |
| "RTSP tidak didukung browser" | URL RTSP mentah diisi langsung ke FIDS — harus lewat go2rtc |
| "Stream tidak tersedia" | go2rtc mati, port terblokir firewall, atau kamera offline |
| Jalan di laptop, gagal di TV | URL memakai `localhost`/IP yang tak terjangkau dari subnet TV |
| Semua blokir setelah pindah HTTPS | Mixed content: halaman `https://` tidak boleh memuat iframe `http://` — proxy go2rtc lewat nginx dengan TLS |

## Catatan HTTPS

Bila FIDS dilayani lewat HTTPS, iframe `http://IP:1984` akan diblokir browser.
Proxy-kan go2rtc lewat nginx pada domain yang sama:

```nginx
location /go2rtc/ {
    proxy_pass http://127.0.0.1:1984/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;   # WebSocket untuk WebRTC/MSE
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

URL Stream lalu menjadi `https://domain-anda/go2rtc/stream.html?src=belt_b1&mode=webrtc`.
