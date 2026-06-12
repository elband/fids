<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DisplaySetting extends Model
{
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
    ];

    protected $casts = [
        'tampilkan_cuaca' => 'boolean',
        'tampilkan_logo_maskapai' => 'boolean',
        'show_departures' => 'boolean',
        'show_arrivals' => 'boolean',
        'show_advertisement' => 'boolean',
    ];
}
