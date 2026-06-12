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

echo "==> [1/8] Installing PHP dependencies..."
composer install --optimize-autoloader --no-dev

echo "==> [2/8] Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    php artisan key:generate
    echo "     .env created — edit APP_URL, DB_*, etc. before continuing"
    exit 1
fi

echo "==> [3/8] Running database migrations..."
if [ "$FRESH" = true ]; then
    php artisan migrate:fresh --force
else
    php artisan migrate --force
fi

echo "==> [4/8] Seeding database..."
if [ "$NO_SEED" = false ]; then
    php artisan db:seed --force
fi

echo "==> [5/8] Linking storage..."
php artisan storage:link --force

echo "==> [6/8] Building frontend assets..."
npm ci
npm run build

echo "==> [7/8] Caching config, routes, and views..."
php artisan optimize

echo "==> [8/8] Setting permissions..."
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

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
