#!/usr/bin/env bash
# =====================================================================
# FIDS — Restore Database + Media  | Audit M-05
# Jalankan di server produksi (Linux).
#
#   Usage:
#     ./scripts/restore.sh <db_dump.sql.gz> [media.tar.gz]
#
#   Contoh:
#     ./scripts/restore.sh /var/backups/fids/db/fids_db_20260623_020000.sql.gz \
#                          /var/backups/fids/media/fids_media_20260623_020000.tar.gz
#
# PERINGATAN: operasi ini MENIMPA database & media saat ini.
# =====================================================================
set -euo pipefail

APP_DIR="${FIDS_APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
ENV_FILE="$APP_DIR/.env"
DB_DUMP="${1:-}"
MEDIA_TAR="${2:-}"

log() { echo "[$(date '+%F %T')] $*"; }

[ -n "$DB_DUMP" ] || { echo "Usage: $0 <db_dump.sql.gz> [media.tar.gz]"; exit 1; }
[ -f "$DB_DUMP" ] || { echo "ERROR: file dump tidak ditemukan: $DB_DUMP"; exit 1; }
[ -f "$ENV_FILE" ] || { echo "ERROR: .env tidak ditemukan"; exit 1; }

getenv() { grep -E "^$1=" "$ENV_FILE" | tail -n1 | cut -d'=' -f2- | sed 's/^"\(.*\)"$/\1/'; }
DB_DATABASE="$(getenv DB_DATABASE)"
DB_USERNAME="$(getenv DB_USERNAME)"
DB_PASSWORD="$(getenv DB_PASSWORD)"
DB_HOST="$(getenv DB_HOST)"; DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="$(getenv DB_PORT)"; DB_PORT="${DB_PORT:-3306}"

echo "================================================================"
echo " AKAN MENIMPA database '$DB_DATABASE' di $DB_HOST:$DB_PORT"
echo " Sumber DB    : $DB_DUMP"
echo " Sumber Media : ${MEDIA_TAR:-(tidak ada)}"
echo "================================================================"
read -r -p "Ketik 'YA' untuk melanjutkan: " CONFIRM
[ "$CONFIRM" = "YA" ] || { echo "Dibatalkan."; exit 1; }

# Masuk maintenance mode bila artisan tersedia
( cd "$APP_DIR" && php artisan down --render="errors::503" ) || true

# --- 1. Restore Database ---
log "Restore database..."
gunzip -c "$DB_DUMP" | MYSQL_PWD="$DB_PASSWORD" mysql \
    --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USERNAME" \
    --default-character-set=utf8mb4 "$DB_DATABASE"
log "Database OK"

# --- 2. Restore Media (opsional) ---
if [ -n "$MEDIA_TAR" ] && [ -f "$MEDIA_TAR" ]; then
    log "Restore media..."
    mkdir -p "$APP_DIR/storage/app"
    tar -xzf "$MEDIA_TAR" -C "$APP_DIR/storage/app"
    log "Media OK"
fi

# --- 3. Re-link storage & bersihkan cache ---
( cd "$APP_DIR" && php artisan storage:link --force >/dev/null 2>&1 || true )
( cd "$APP_DIR" && php artisan optimize:clear >/dev/null 2>&1 || true )

# Keluar maintenance mode
( cd "$APP_DIR" && php artisan up ) || true

log "Restore selesai. Verifikasi: /up, login admin, render /public/screen."
