#!/bin/bash
# FIDS Deployment Script
# Usage: ./deploy.sh [--fresh] [--no-seed]
# --fresh   : drop and recreate database (WARNING: destroys all data)
# --no-seed : skip database seeding

set -e

# Skrip memakai path relatif (.env, storage/, bootstrap/cache). Tanpa ini,
# memanggilnya dari direktori lain (mis. cron atau `sudo bash /var/www/fids/deploy.sh`)
# akan menyentuh direktori yang salah atau gagal di tengah jalan.
cd "$(dirname "$0")"

FRESH=false
NO_SEED=false

for arg in "$@"; do
    case $arg in
        --fresh) FRESH=true ;;
        --no-seed) NO_SEED=true ;;
        *) echo "Argumen tidak dikenal: $arg"; exit 1 ;;
    esac
done

TOTAL=11

echo "==> [1/$TOTAL] Pemeriksaan awal..."
# Gagal di sini jauh lebih murah daripada gagal setelah migrasi berjalan.
for cmd in php composer npm; do
    command -v "$cmd" >/dev/null || { echo "     GAGAL: '$cmd' tidak ditemukan di PATH."; exit 1; }
done

if [ ! -f .env ]; then
    cp .env.example .env
    php artisan key:generate
    echo "     .env created — edit APP_URL, DB_*, etc. before continuing"
    exit 1
fi

if [ "$FRESH" = true ] && [ "$NO_SEED" = true ]; then
    echo "     GAGAL: --fresh bersama --no-seed menghasilkan database kosong tanpa"
    echo "            role, permission, maupun user admin — aplikasi tidak bisa dipakai."
    exit 1
fi

if [ "$FRESH" = true ]; then
    echo ""
    echo "     PERINGATAN: --fresh akan MENGHAPUS SELURUH DATA di database."
    # Untuk pemakaian otomatis (CI), setel FIDS_CONFIRM_FRESH=HAPUS. Tanpa itu,
    # skrip yang dijalankan tanpa terminal berhenti di sini — gagal menutup jauh
    # lebih baik daripada diam-diam menghapus database produksi.
    confirm="${FIDS_CONFIRM_FRESH:-}"
    if [ -z "$confirm" ]; then
        printf "     Ketik 'HAPUS' untuk melanjutkan: "
        read -r confirm || confirm=""
    fi
    [ "$confirm" = "HAPUS" ] || { echo "     Dibatalkan."; exit 1; }
    echo ""
fi

echo "==> [2/$TOTAL] Installing PHP dependencies..."
composer install --optimize-autoloader --no-dev --no-interaction --prefer-dist

echo "==> [3/$TOTAL] Membuang cache lama..."
# WAJIB sebelum langkah apa pun yang menyentuh database. Cache config dari deploy
# sebelumnya masih memuat nilai .env yang lama, sehingga migrasi bisa berjalan ke
# kredensial atau host database yang salah tanpa satu pun pesan error.
#
# Sengaja tidak memakai `optimize:clear`: perintah itu ikut menjalankan
# cache:clear, sedangkan CACHE_STORE=database — bila database belum siap,
# deploy gagal di langkah pembersihan alih-alih di langkah yang sebenarnya.
php artisan config:clear
php artisan route:clear
php artisan view:clear

echo "==> [4/$TOTAL] Building frontend assets..."
# Dibangun SEBELUM migrasi. Build adalah langkah yang paling sering gagal
# (dependensi baru, memori habis), sedangkan migrasi tidak bisa dibatalkan.
# Bila urutannya terbalik, build yang gagal meninggalkan database dengan skema
# baru sementara aplikasi masih menyajikan kode lama.
#
# --include=dev wajib: vite & plugin-nya ada di devDependencies, sedangkan server
# produksi umumnya menyetel NODE_ENV=production yang membuat `npm ci` polos
# melewatkannya — build lalu gagal dengan "vite: not found".
npm ci --include=dev
npm run build

# public/build/ tidak ikut di-commit (lihat .gitignore), jadi bila build diam-diam
# tidak menghasilkan manifest, seluruh layar akan blank saat diakses.
if [ ! -f public/build/manifest.json ]; then
    echo "     GAGAL: public/build/manifest.json tidak terbentuk — hentikan deploy."
    exit 1
fi

echo "==> [5/$TOTAL] Running database migrations..."
if [ "$FRESH" = true ]; then
    php artisan migrate:fresh --force
else
    php artisan migrate --force
fi

echo "==> [6/$TOTAL] Seeding database..."
if [ "$NO_SEED" = false ]; then
    # Seeder memakai firstOrCreate, jadi aman dijalankan ulang tiap deploy.
    php artisan db:seed --force
else
    echo "     dilewati (--no-seed)"
fi

echo "==> [7/$TOTAL] Linking storage..."
php artisan storage:link --force

echo "==> [8/$TOTAL] Caching config, routes, and views..."
php artisan optimize

echo "==> [9/$TOTAL] Setting permissions..."
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

echo "==> [10/$TOTAL] Memuat ulang PHP-FPM..."
# Tanpa ini, OPcache yang disetel validate_timestamps=0 tetap menjalankan bytecode
# lama walau file di disk sudah diganti: deploy terlihat sukses dan `git log`
# menunjuk commit baru, tapi perilaku aplikasi tidak berubah sama sekali.
FPM_SERVICE=$(systemctl list-units --type=service --no-legend 'php*-fpm.service' 2>/dev/null | awk '{print $1}' | head -1)
if [ -n "$FPM_SERVICE" ]; then
    systemctl reload "$FPM_SERVICE" && echo "     $FPM_SERVICE dimuat ulang" \
        || echo "     GAGAL memuat ulang $FPM_SERVICE — jalankan manual"
else
    echo "     PHP-FPM tidak terdeteksi (lewati). Bila memakai server lain, muat ulang manual."
fi

echo "==> [11/$TOTAL] Memberi tahu queue worker agar memakai kode baru..."
# Worker adalah proses PHP yang berumur panjang: tanpa ini ia terus menjalankan
# kode versi lama sampai di-restart manual — masalah yang sama dengan OPcache
# di langkah sebelumnya, tapi pada sisi antrean.
php artisan queue:restart

echo ""
echo "Deployment complete."
echo ""
echo "Post-deploy checklist:"
echo "  1. Verify APP_URL in .env matches server domain"
echo "  2. Set up cron job for the scheduler:"
echo "     * * * * * cd $(pwd) && php artisan schedule:run >> /dev/null 2>&1"
echo "  3. Set up queue worker (supervisor or systemd):"
echo "     php artisan queue:work --sleep=3 --tries=3"
echo "  4. For audio announcements on Linux, install: apt install mpg123"
echo "  5. Layar CCTV memakai gateway RTSP terpisah — lihat docs/CCTV-GO2RTC.md"
