<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Pengamatan METAR terakhir per stasiun ICAO beserta status penarikan datanya.
 * Data pengamatan tidak dihapus saat penarikan gagal: layar tetap bisa
 * menampilkan angka terakhir sambil menjelaskan alasan kegagalannya.
 */
class MetarReport extends Model
{
    protected $fillable = [
        'icao', 'raw_text', 'observed_at',
        'wind_dir_deg', 'wind_variable', 'wind_var_from', 'wind_var_to', 'wind_speed_kt', 'wind_gust_kt',
        'visibility_m', 'present_weather', 'clouds', 'temperature_c', 'dew_point_c', 'qnh_hpa', 'trend',
        'last_attempt_at', 'last_success_at', 'error_code', 'error_message',
    ];

    protected $casts = [
        'observed_at' => 'datetime',
        'last_attempt_at' => 'datetime',
        'last_success_at' => 'datetime',
        'wind_variable' => 'boolean',
        'wind_dir_deg' => 'integer',
        'wind_var_from' => 'integer',
        'wind_var_to' => 'integer',
        'wind_speed_kt' => 'integer',
        'wind_gust_kt' => 'integer',
        'visibility_m' => 'integer',
        'temperature_c' => 'integer',
        'dew_point_c' => 'integer',
        'qnh_hpa' => 'integer',
    ];
}
