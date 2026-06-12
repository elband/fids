<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
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
