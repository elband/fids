<?php

namespace App\Services\Metar;

use RuntimeException;

/**
 * Kegagalan penarikan METAR dengan kode yang stabil (untuk logika/tes) dan
 * pesan berbahasa Indonesia yang langsung ditampilkan di layar AMC.
 */
class MetarFetchException extends RuntimeException
{
    public const KONFIGURASI = 'konfigurasi';
    public const KONEKSI = 'koneksi';
    public const DIBLOKIR = 'diblokir';
    public const HTTP = 'http';
    public const STRUKTUR = 'struktur';
    public const KOSONG = 'kosong';
    public const FORMAT = 'format';

    public function __construct(public readonly string $reason, string $message)
    {
        parent::__construct($message);
    }
}
