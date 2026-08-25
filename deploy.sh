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
    esac
done

echo "==> [1/10] Installing PHP dependencies..."
composer install --optimize-autoloader --no-dev --no-interaction --prefer-dist

echo "==> [2/10] Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    php artisan key:generate
    echo "     .env created — edit APP_URL, DB_*, etc. before continuing"
    exit 1
fi

echo "==> [3/10] Running database migrations..."
if [ "$FRESH" = true ]; then
    php artisan migrate:fresh --force
else
    php artisan migrate --force
fi

echo "==> [4/10] Seeding database..."
if [ "$NO_SEED" = false ]; then
    php artisan db:seed --force
fi

echo "==> [5/10] Linking storage..."
php artisan storage:link --force

echo "==> [6/10] Building frontend assets..."
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

echo "==> [7/10] Caching config, routes, and views..."
php artisan optimize

echo "==> [8/10] Setting permissions..."
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

echo "==> [9/10] Memuat ulang PHP-FPM..."
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

echo "==> [10/10] Memberi tahu queue worker agar memakai kode baru..."
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
