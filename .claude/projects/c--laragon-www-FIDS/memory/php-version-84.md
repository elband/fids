---
name: php-version-84
description: FIDS butuh PHP 8.4; PHP default Laragon (8.1) gagal jalankan artisan/test
metadata:
  type: project
---

Project FIDS memerlukan PHP 8.4 (vendor terinstal untuk 8.4, `composer.json` `require php ^8.3`). PHP default di PATH (`C:\laragon\bin\php\php-8.1.10-...`) menolak jalan dengan platform_check error.

**How to apply:** untuk artisan/test, pakai binari 8.4 eksplisit:
`& "C:\laragon\bin\php\php-8.4.21-Win32-vs17-x64\php.exe" artisan test`

Test suite dijalankan via `php artisan test` (Pest/PHPUnit). Frontend: `npx tsc --noEmit` untuk typecheck.
