<?php

namespace App\Models;

use App\Models\Concerns\BustsTaxiCache;
use Illuminate\Database\Eloquent\Model;

class TaxiSetting extends Model
{
    use BustsTaxiCache;

    protected $fillable = [
        'judul_layar', 'logo_path', 'background_path', 'warna_aksen', 'tema_warna',
        'video_interval_detik', 'flight_refresh_detik', 'running_text_speed', 'scroll_detik_per_layar',
        'bahasa', 'bahasa_switch_detik',
        'tampilkan_penerbangan', 'tampilkan_video', 'tampilkan_tarif', 'mode_hemat',
        'emergency_active', 'emergency_judul', 'emergency_pesan', 'emergency_sampai',
    ];

    protected $casts = [
        'video_interval_detik' => 'integer',
        'flight_refresh_detik' => 'integer',
        'running_text_speed' => 'integer',
        'scroll_detik_per_layar' => 'integer',
        'bahasa_switch_detik' => 'integer',
        'tampilkan_penerbangan' => 'boolean',
        'tampilkan_video' => 'boolean',
        'tampilkan_tarif' => 'boolean',
        'mode_hemat' => 'boolean',
        'emergency_active' => 'boolean',
        'emergency_sampai' => 'datetime',
    ];

    /** Baris pengaturan tunggal; dibuat jika belum ada agar admin/API tidak pernah null. */
    public static function current(): self
    {
        return static::query()->firstOrCreate([], ['judul_layar' => 'TAXI INFORMATION']);
    }

    /** Emergency dianggap aktif hanya bila belum lewat batas waktunya. */
    public function emergencyIsLive(): bool
    {
        if (! $this->emergency_active) {
            return false;
        }

        return $this->emergency_sampai === null || $this->emergency_sampai->isFuture();
    }
}
