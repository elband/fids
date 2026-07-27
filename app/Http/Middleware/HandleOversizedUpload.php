<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Menangani unggahan yang melebihi post_max_size PHP.
 *
 * Bila batas itu terlampaui, PHP membuang SELURUH body permintaan sebelum
 * Laravel berjalan: $_POST dan $_FILES kosong. Akibatnya validasi melaporkan
 * semua kolom "wajib diisi" — menyesatkan operator yang formulirnya jelas
 * terisi (gejala persis inilah yang muncul saat mengunggah video signage).
 *
 * ValidatePostSize bawaan Laravel mendeteksi hal yang sama tetapi melempar
 * PostTooLargeException dari middleware GLOBAL, yang berjalan sebelum
 * StartSession — sehingga redirect berbekal flash message tidak bisa dipakai
 * (sesinya belum ada). Middleware ini dipasang di grup web, setelah sesi siap,
 * agar pesannya benar-benar sampai ke operator sebagai notifikasi.
 */
class HandleOversizedUpload
{
    public function handle(Request $request, Closure $next): Response
    {
        $max = $this->postMaxSize();
        $length = (int) $request->server('CONTENT_LENGTH', 0);

        // post_max_size = 0 berarti tanpa batas.
        if ($max <= 0 || $length <= $max) {
            return $next($request);
        }

        $pesan = sprintf(
            'Berkas terlalu besar (%s). Batas unggahan server saat ini %s. '
            . 'Minta administrator menaikkan post_max_size dan upload_max_filesize '
            . 'di php.ini — tersedia skrip scripts/set-php-limits.sh.',
            $this->format($length),
            $this->format($max),
        );

        if ($request->expectsJson()) {
            return response()->json(['message' => $pesan], 413);
        }

        return back()->with('error', $pesan);
    }

    /** Nilai post_max_size dalam byte; 0 bila tak dibatasi. */
    private function postMaxSize(): int
    {
        $raw = trim((string) ini_get('post_max_size'));

        if ($raw === '') {
            return 0;
        }

        $angka = (int) $raw;

        return match (strtoupper(substr($raw, -1))) {
            'G' => $angka * 1024 ** 3,
            'M' => $angka * 1024 ** 2,
            'K' => $angka * 1024,
            default => $angka,
        };
    }

    private function format(int $bytes): string
    {
        if ($bytes >= 1024 ** 3) {
            return round($bytes / 1024 ** 3, 1) . ' GB';
        }
        if ($bytes >= 1024 ** 2) {
            return round($bytes / 1024 ** 2, 1) . ' MB';
        }

        return round($bytes / 1024) . ' KB';
    }
}
