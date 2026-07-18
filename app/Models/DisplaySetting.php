<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class DisplaySetting extends Model
{
    protected static function booted(): void
    {
        // Ubah ticker/logo/timezone/bahasa → langsung bust cache API terkait,
        // supaya perubahan tidak menunggu TTL_SETTINGS (sebelumnya lag ≤15 dtk).
        $flush = function () {
            Cache::forget('fids:api:settings');
            Cache::forget('fids:api:time-meta');
        };
        static::saved($flush);
        static::deleted($flush);
    }

    protected $fillable = [
        'nama_bandara', 
        'logo_bandara', 
        'background_header', 
        'tema_warna', 
        'interval_refresh', 
        'kecepatan_running_text', 
        'kecepatan_scroll', 
        'teks_ticker', 
        'tampilkan_cuaca', 
        'tampilkan_logo_maskapai', 
        'show_departures',
        'show_arrivals',
        'show_advertisement',
        'mode_default',
        'lokasi_google_maps',
        'kode_bmkg',
        'bahasa',
        'timezone',
        'force_reload_at',
        'bagasi_durasi_status_menit',
        'bagasi_kamera_mulai_menit',
        'bagasi_kamera_selesai_menit',
    ];

    protected $casts = [
        'tampilkan_cuaca' => 'boolean',
        'tampilkan_logo_maskapai' => 'boolean',
        'show_departures' => 'boolean',
        'show_arrivals' => 'boolean',
        'show_advertisement' => 'boolean',
        'force_reload_at' => 'datetime',
        'bagasi_durasi_status_menit' => 'integer',
        'bagasi_kamera_mulai_menit' => 'integer',
        'bagasi_kamera_selesai_menit' => 'integer',
    ];
}
