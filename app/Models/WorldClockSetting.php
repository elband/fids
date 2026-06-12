<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorldClockSetting extends Model
{
    protected $fillable = [
        'show_utc',
        'show_wib',
        'show_wita',
        'show_wit',
        'format_waktu',
        'show_seconds',
        'show_date',
        'tema_warna',
        'accent_color',
        'judul_layar',
        'show_nama_bandara',
        'show_analog_clock',
        'show_ntp_status',
        'use_background_image',
    ];

    protected $casts = [
        'show_utc' => 'boolean',
        'show_wib' => 'boolean',
        'show_wita' => 'boolean',
        'show_wit' => 'boolean',
        'show_seconds' => 'boolean',
        'show_date' => 'boolean',
        'show_nama_bandara' => 'boolean',
        'show_analog_clock' => 'boolean',
        'show_ntp_status' => 'boolean',
        'use_background_image' => 'boolean',
    ];
}
