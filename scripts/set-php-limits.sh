#!/usr/bin/env bash
# =====================================================================
# FIDS — Setel batas unggah PHP untuk modul Taxi Digital Signage
#
# Modul Taxi menerima video MP4 sampai 200 MB. Nilai bawaan PHP (2 MB)
# jauh di bawah itu, dan karena middleware ValidatePostSize dilepas di
# bootstrap/app.php, unggahan yang kebesaran GAGAL DIAM-DIAM: form sampai
# ke controller dengan isi kosong, tanpa pesan error yang jelas.
#
# Skrip ini menyunting php.ini milik FPM (yang dipakai web), bukan CLI.
#
#   sudo ./scripts/set-php-limits.sh              # terapkan
#   sudo ./scripts/set-php-limits.sh --dry-run    # lihat rencananya saja
#
# Variabel opsional:
#   PHP_INI       paksa berkas php.ini tertentu
#   FPM_SERVICE   nama service yang di-restart (default: dideteksi)
#   MAX_SIZE      batas unggah (default: 256M)
#   MAX_TIME      max_execution_time detik (default: 600)
#   MEM_LIMIT     memory_limit (default: 512M)
# =====================================================================

set -euo pipefail

MAX_SIZE="${MAX_SIZE:-256M}"
MAX_TIME="${MAX_TIME:-600}"
MEM_LIMIT="${MEM_LIMIT:-512M}"
DRY_RUN=false

for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=true ;;
        -h|--help) sed -n '2,22p' "$0"; exit 0 ;;
        *) echo "Argumen tak dikenal: $arg" >&2; exit 1 ;;
    esac
done

# --- 1. Temukan php.ini yang dipakai web -----------------------------
find_ini() {
    if [[ -n "${PHP_INI:-}" ]]; then
        echo "$PHP_INI"; return
    fi

    # php-fpm -i paling akurat: itulah SAPI yang melayani permintaan web.
    local fpm
    for fpm in php-fpm $(compgen -c 'php-fpm' 2>/dev/null | sort -u); do
        if command -v "$fpm" >/dev/null 2>&1; then
            local found
            found=$("$fpm" -i 2>/dev/null | awk -F'=> ' '/^Loaded Configuration File/ {print $2; exit}')
            if [[ -n "$found" && -f "$found" ]]; then
                echo "$found"; return
            fi
        fi
    done

    # Cadangan: tebak dari layout Debian/Ubuntu, ambil versi tertinggi.
    local guess
    guess=$(ls -1 /etc/php/*/fpm/php.ini 2>/dev/null | sort -V | tail -1 || true)
    [[ -n "$guess" ]] && { echo "$guess"; return; }

    # Cadangan terakhir: php.ini milik CLI (lebih baik daripada gagal).
    php -r 'echo php_ini_loaded_file() ?: "";' 2>/dev/null
}

INI="$(find_ini)"

if [[ -z "$INI" || ! -f "$INI" ]]; then
    echo "GAGAL: php.ini tidak ditemukan. Tentukan manual:" >&2
    echo "  sudo PHP_INI=/etc/php/8.3/fpm/php.ini $0" >&2
    exit 1
fi

echo "php.ini  : $INI"
if [[ "$INI" == *"/cli/"* ]]; then
    echo "PERINGATAN: ini php.ini milik CLI, bukan FPM. Unggahan lewat browser"
    echo "            mungkin tidak terpengaruh. Cek 'php-fpm -i' di server ini."
fi

# --- 2. Terapkan nilai ------------------------------------------------
declare -A TARGET=(
    [upload_max_filesize]="$MAX_SIZE"
    [post_max_size]="$MAX_SIZE"
    [max_execution_time]="$MAX_TIME"
    [max_input_time]="$MAX_TIME"
    [memory_limit]="$MEM_LIMIT"
)

echo
printf '%-22s %-12s -> %s\n' "SETELAN" "SEKARANG" "MENJADI"
for key in upload_max_filesize post_max_size max_execution_time max_input_time memory_limit; do
    current=$(grep -oP "^\s*${key}\s*=\s*\K\S+" "$INI" | tail -1 || true)
    printf '%-22s %-12s -> %s\n' "$key" "${current:-(tidak diset)}" "${TARGET[$key]}"
done

if [[ "$DRY_RUN" == true ]]; then
    echo
    echo "--dry-run: tidak ada yang diubah."
    exit 0
fi

BACKUP="${INI}.bak-$(date +%Y%m%d-%H%M%S)"
cp -p "$INI" "$BACKUP"
echo
echo "Cadangan : $BACKUP"

for key in "${!TARGET[@]}"; do
    value="${TARGET[$key]}"
    if grep -qP "^\s*;?\s*${key}\s*=" "$INI"; then
        # Ganti baris yang ada (termasuk yang dikomentari dengan ';').
        sed -i -E "s|^\s*;?\s*(${key})\s*=.*|\1 = ${value}|" "$INI"
    else
        # Belum ada sama sekali — tambahkan di akhir berkas.
        printf '\n%s = %s\n' "$key" "$value" >> "$INI"
    fi
done

# --- 3. Verifikasi hasil suntingan ------------------------------------
echo
echo "Hasil    :"
for key in upload_max_filesize post_max_size max_execution_time max_input_time memory_limit; do
    printf '  %-22s %s\n' "$key" "$(grep -oP "^\s*${key}\s*=\s*\K\S+" "$INI" | tail -1)"
done

# --- 4. Restart FPM ---------------------------------------------------
restart_fpm() {
    if [[ -n "${FPM_SERVICE:-}" ]]; then
        systemctl restart "$FPM_SERVICE" && echo "  $FPM_SERVICE di-restart."
        return
    fi

    local svc
    svc=$(systemctl list-units --type=service --all --plain --no-legend 2>/dev/null \
          | awk '{print $1}' | grep -E '^php.*fpm\.service$' | head -1 || true)

    if [[ -n "$svc" ]]; then
        systemctl restart "$svc" && echo "  $svc di-restart."
    else
        echo "  Service PHP-FPM tidak terdeteksi — restart manual, mis.:"
        echo "    sudo systemctl restart php8.3-fpm"
    fi
}

echo
echo "Restart PHP-FPM:"
if [[ "$(id -u)" -ne 0 ]]; then
    echo "  Butuh root. Jalankan ulang dengan sudo, atau restart manual."
else
    restart_fpm
fi

echo
echo "Selesai. Verifikasi dari sisi web dengan mengunggah satu video di"
echo "menu Taxi Information → Playlist Video."
