#!/usr/bin/env bash
# =====================================================================
# FIDS — Backup Otomatis (Database + Media)  | Audit M-05
# Jalankan di server produksi (Linux). Disarankan via cron harian.
#
#   Contoh cron (setiap hari 02:00):
#   0 2 * * * /var/www/fids/scripts/backup.sh >> /var/log/fids-backup.log 2>&1
#
# Variabel opsional (env atau edit di bawah):
#   FIDS_BACKUP_DIR   (default: /var/backups/fids)
#   FIDS_RETENTION    (hari, default: 14)
#   FIDS_APP_DIR      (default: direktori induk skrip ini)
# =====================================================================
set -euo pipefail

APP_DIR="${FIDS_APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BACKUP_DIR="${FIDS_BACKUP_DIR:-/var/backups/fids}"
RETENTION="${FIDS_RETENTION:-14}"
TS="$(date +%Y%m%d_%H%M%S)"
ENV_FILE="$APP_DIR/.env"

log() { echo "[$(date '+%F %T')] $*"; }

[ -f "$ENV_FILE" ] || { echo "ERROR: .env tidak ditemukan di $ENV_FILE"; exit 1; }

# Ambil kredensial DB dari .env (aman terhadap spasi & komentar)
getenv() { grep -E "^$1=" "$ENV_FILE" | tail -n1 | cut -d'=' -f2- | sed 's/^"\(.*\)"$/\1/'; }
DB_DATABASE="$(getenv DB_DATABASE)"
DB_USERNAME="$(getenv DB_USERNAME)"
DB_PASSWORD="$(getenv DB_PASSWORD)"
DB_HOST="$(getenv DB_HOST)"; DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="$(getenv DB_PORT)"; DB_PORT="${DB_PORT:-3306}"

mkdir -p "$BACKUP_DIR/db" "$BACKUP_DIR/media"

# --- 1. Backup Database (konsisten, termasuk routine & trigger) ---
DB_FILE="$BACKUP_DIR/db/fids_db_${TS}.sql.gz"
log "Dump database '$DB_DATABASE' -> $DB_FILE"
MYSQL_PWD="$DB_PASSWORD" mysqldump \
    --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USERNAME" \
    --single-transaction --quick --routines --triggers --events \
    --default-character-set=utf8mb4 \
    "$DB_DATABASE" | gzip -9 > "$DB_FILE"
log "Database OK ($(du -h "$DB_FILE" | cut -f1))"

# --- 2. Backup Media (storage/app/public: logo, idle image, iklan) ---
MEDIA_FILE="$BACKUP_DIR/media/fids_media_${TS}.tar.gz"
if [ -d "$APP_DIR/storage/app/public" ]; then
    log "Arsip media -> $MEDIA_FILE"
    tar -czf "$MEDIA_FILE" -C "$APP_DIR/storage/app" public
    log "Media OK ($(du -h "$MEDIA_FILE" | cut -f1))"
fi

# --- 3. Verifikasi integritas arsip DB ---
if gzip -t "$DB_FILE"; then log "Verifikasi gzip DB: OK"; else log "PERINGATAN: arsip DB rusak!"; exit 2; fi

# --- 4. Retensi: hapus backup lebih tua dari RETENTION hari ---
log "Pangkas backup > ${RETENTION} hari"
find "$BACKUP_DIR/db"    -name 'fids_db_*.sql.gz' -mtime +"$RETENTION" -delete || true
find "$BACKUP_DIR/media" -name 'fids_media_*.tar.gz' -mtime +"$RETENTION" -delete || true

# --- 5. (Opsional) Salin offsite — aktifkan salah satu ---
# aws s3 cp "$DB_FILE" "s3://fids-backup/db/" && aws s3 cp "$MEDIA_FILE" "s3://fids-backup/media/"
# rclone copy "$BACKUP_DIR" remote:fids-backup

log "Backup selesai: $TS"
