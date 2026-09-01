#!/usr/bin/env bash
# =====================================================================
# FIDS — Pemasangan go2rtc (gerbang RTSP → WebRTC/MJPEG/HLS)
# Jalankan sebagai root di mesin yang menjadi gerbang stream (VM go2rtc
# terpisah bila ada — bukan di server aplikasi FIDS):
#
#   sudo ./scripts/install-go2rtc.sh
#
# Browser tidak bisa memutar RTSP. go2rtc menarik stream RTSP dari
# NVR/kamera lalu menyajikannya ulang dalam format yang bisa dipasang di
# kolom "URL Stream" pada menu admin CCTV Cameras.
#
# Skrip ini idempoten: dijalankan ulang hanya memutakhirkan biner dan
# TIDAK pernah menimpa /etc/go2rtc/go2rtc.yaml yang sudah berisi
# kredensial kamera.
#
# Variabel opsional:
#   GO2RTC_VERSION   (default: rilis terbaru; isi mis. v1.9.4 untuk mengunci)
#   GO2RTC_PORT      (default: 1984)
# =====================================================================
set -euo pipefail

VERSION="${GO2RTC_VERSION:-latest}"
PORT="${GO2RTC_PORT:-1984}"
BIN_PATH="/usr/local/bin/go2rtc"
CONF_DIR="/etc/go2rtc"
CONF_FILE="$CONF_DIR/go2rtc.yaml"
DATA_DIR="/var/lib/go2rtc"
UNIT_FILE="/etc/systemd/system/go2rtc.service"
SVC_USER="go2rtc"

log()  { echo "[$(date '+%F %T')] $*"; }
fail() { echo "ERROR: $*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "harus dijalankan sebagai root (pakai sudo)"
command -v curl >/dev/null || fail "curl belum terpasang — apt install curl"
command -v systemctl >/dev/null || fail "systemd tidak terdeteksi; pasang manual"

# --- 1. Tentukan arsitektur -----------------------------------------
case "$(uname -m)" in
    x86_64)         ARCH="amd64" ;;
    aarch64|arm64)  ARCH="arm64" ;;
    armv7l|armv6l)  ARCH="arm" ;;
    i386|i686)      ARCH="i386" ;;
    *) fail "arsitektur $(uname -m) tidak dikenali — unduh biner manual" ;;
esac
log "==> [1/6] Arsitektur terdeteksi: linux_$ARCH"

# --- 2. Tentukan versi ----------------------------------------------
# Versi dipatok ke tag rilis nyata, bukan URL /latest/, supaya log
# pemasangan menyebut versi persis yang terpasang saat audit.
if [ "$VERSION" = "latest" ]; then
    log "==> [2/6] Mencari rilis terbaru go2rtc..."
    VERSION="$(curl -fsSL https://api.github.com/repos/AlexxIT/go2rtc/releases/latest \
        | grep -m1 '"tag_name"' | cut -d'"' -f4 || true)"
    [ -n "$VERSION" ] || fail "gagal membaca versi terbaru (rate limit GitHub?). Ulangi dengan GO2RTC_VERSION=v1.9.4"
else
    log "==> [2/6] Memakai versi terkunci: $VERSION"
fi
log "     versi: $VERSION"

# --- 3. Unduh biner --------------------------------------------------
URL="https://github.com/AlexxIT/go2rtc/releases/download/${VERSION}/go2rtc_linux_${ARCH}"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

log "==> [3/6] Mengunduh $URL"
curl -fsSL --retry 3 -o "$TMP" "$URL" || fail "unduhan gagal — cek koneksi atau nama aset rilis"
# Aset rilis yang salah (mis. halaman HTML 404) tetap tersimpan sebagai file;
# tanpa uji jalan di bawah, service akan gagal start dengan pesan membingungkan.
# Uji lewat magic byte ELF, bukan dengan menjalankan biner: cek ini harus tetap
# sahih saat memasang biner arm64 dari mesin lain, dan tidak bergantung pada
# nama flag versi go2rtc yang bisa berubah antar rilis.
if [ "$(head -c 4 "$TMP" | od -An -tx1 | tr -d '[:space:]')" != "7f454c46" ]; then
    fail "berkas terunduh bukan biner Linux (kemungkinan halaman 404) — cek GO2RTC_VERSION=$VERSION"
fi
chmod +x "$TMP"
install -m 0755 "$TMP" "$BIN_PATH"
log "     terpasang di $BIN_PATH"

# --- 4. User sistem & direktori --------------------------------------
log "==> [4/6] Menyiapkan user sistem dan direktori..."
if ! id -u "$SVC_USER" >/dev/null 2>&1; then
    useradd --system --no-create-home --shell /usr/sbin/nologin "$SVC_USER"
    log "     user '$SVC_USER' dibuat"
fi
install -d -o "$SVC_USER" -g "$SVC_USER" -m 0750 "$CONF_DIR" "$DATA_DIR"

if [ -f "$CONF_FILE" ]; then
    log "     $CONF_FILE sudah ada — dipertahankan (kredensial kamera tidak ditimpa)"
else
    cat > "$CONF_FILE" <<YAML
# go2rtc — konfigurasi stream CCTV FIDS
#
# Tambahkan satu baris per kamera di bawah "streams". Nama di kiri (mis.
# belt_b1) adalah yang dipakai pada parameter ?src= di URL Stream FIDS.
#
# Contoh path RTSP per merek:
#   Hikvision : rtsp://user:sandi@IP:554/Streaming/Channels/101
#   Dahua     : rtsp://user:sandi@IP:554/cam/realmonitor?channel=1&subtype=0
#   Uniview   : rtsp://user:sandi@IP:554/media/video1
#
# Setelah diubah: sudo systemctl restart go2rtc

api:
  listen: ":${PORT}"

webrtc:
  # Port sinyal WebRTC. Buka di firewall bila TV berada di subnet lain.
  listen: ":8555"

streams:
  belt_b1: rtsp://GANTI_USER:GANTI_SANDI@192.168.1.64:554/Streaming/Channels/101
YAML
    # Berisi sandi RTSP — jangan world-readable.
    chown "$SVC_USER:$SVC_USER" "$CONF_FILE"
    chmod 0640 "$CONF_FILE"
    log "     $CONF_FILE dibuat (berisi placeholder — WAJIB diedit)"
fi

# --- 5. Service systemd ----------------------------------------------
log "==> [5/6] Memasang service systemd..."
cat > "$UNIT_FILE" <<UNIT
[Unit]
Description=go2rtc — gerbang RTSP untuk layar CCTV FIDS
Documentation=https://github.com/AlexxIT/go2rtc
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${SVC_USER}
Group=${SVC_USER}
WorkingDirectory=${DATA_DIR}
ExecStart=${BIN_PATH} -config ${CONF_FILE}
Restart=always
RestartSec=5

NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
# go2rtc menulis balik ke berkas config saat kamera ditambah lewat web UI-nya,
# jadi CONF_DIR harus tetap bisa ditulis meski ProtectSystem=strict.
ReadWritePaths=${CONF_DIR} ${DATA_DIR}

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable go2rtc >/dev/null
systemctl restart go2rtc

# --- 6. Verifikasi ----------------------------------------------------
log "==> [6/6] Memverifikasi service..."
for _ in $(seq 1 10); do
    if curl -fsS -o /dev/null "http://127.0.0.1:${PORT}/"; then
        OK=1; break
    fi
    sleep 1
done

if [ "${OK:-0}" != "1" ]; then
    echo ""
    echo "GAGAL: go2rtc tidak merespons di port ${PORT}."
    echo "Lihat log: journalctl -u go2rtc -n 50 --no-pager"
    exit 1
fi

IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
IP="${IP:-IP-SERVER}"

echo ""
log "go2rtc ${VERSION} aktif dan sudah di-enable saat boot."
echo ""
echo "Langkah lanjutan:"
echo "  1. Edit kamera:     sudo nano ${CONF_FILE}"
echo "     lalu:            sudo systemctl restart go2rtc"
echo "  2. Cek web UI:      http://${IP}:${PORT}"
echo "  3. Buka firewall:   sudo ufw allow ${PORT}/tcp && sudo ufw allow 8555"
echo ""
echo "  4. Isi di admin FIDS → CCTV Cameras:"
echo "     iframe : http://${IP}:${PORT}/stream.html?src=belt_b1&mode=webrtc"
echo "     mjpeg  : http://${IP}:${PORT}/api/stream.mjpeg?src=belt_b1"
echo ""
echo "  Pakai IP server, bukan localhost — TV mengakses dari mesin lain."
