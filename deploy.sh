#!/bin/bash
# FIDS Deployment Script
# Usage: ./deploy.sh [--fresh] [--no-seed]
# --fresh   : drop and recreate database (WARNING: destroys all data)
# --no-seed : skip database seeding

set -e

FRESH=false
NO_SEED=false

for arg in "$@"; do
    case $arg in
        --fresh) FRESH=true ;;
        --no-seed) NO_SEED=true ;;
    esac
done

echo "==> [1/9] Installing PHP dependencies..."
composer install --optimize-autoloader --no-dev

echo "==> [2/9] Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    php artisan key:generate
    echo "     .env created — edit APP_URL, DB_*, etc. before continuing"
    exit 1
fi

echo "==> [3/9] Running database migrations..."
if [ "$FRESH" = true ]; then
    php artisan migrate:fresh --force
else
    php artisan migrate --force
fi

echo "==> [4/9] Seeding database..."
if [ "$NO_SEED" = false ]; then
    php artisan db:seed --force
fi

echo "==> [5/9] Linking storage..."
php artisan storage:link --force

echo "==> [6/9] Building frontend assets..."
npm ci
npm run build

echo "==> [7/9] Caching config, routes, and views..."
php artisan optimize

echo "==> [8/9] Setting permissions..."
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

echo "==> [9/9] Memuat ulang PHP-FPM..."
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
