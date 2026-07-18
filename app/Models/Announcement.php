<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Announcement extends Model
{
    protected static function booted(): void
    {
        // Buat/ubah/hapus pengumuman (termasuk auto-announcement dari FlightService)
        // langsung bust cache daftar pengumuman layar publik.
        $flush = fn () => Cache::forget('fids:api:announcements');
        static::saved($flush);
        static::deleted($flush);
    }

    protected $fillable = [
        'judul', 'isi_pengumuman', 'kategori', 'prioritas', 
        'mulai_tayang', 'selesai_tayang', 'status_aktif',
        'bahasa', 'target', 'mode', 'tipe',
        'broadcast_count', 'max_broadcasts', 'interval_pemutaran', 'last_broadcast_at'
    ];

    protected $casts = [
        'mulai_tayang' => 'datetime',
        'selesai_tayang' => 'datetime',
        'status_aktif' => 'boolean',
        'last_broadcast_at' => 'datetime',
    ];
}
