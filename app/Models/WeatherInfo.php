<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class WeatherInfo extends Model
{
    protected static function booted(): void
    {
        $flush = fn () => Cache::forget('fids:api:weather');
        static::saved($flush);
        static::deleted($flush);
    }

    protected $fillable = ['lokasi', 'suhu', 'kondisi_cuaca', 'kelembapan', 'kecepatan_angin', 'arah_angin', 'arah_angin_derajat',
        'jarak_pandang', 'jarak_pandang_teks', 'tutupan_awan', 'berlaku_pada', 'updated_by'];

    protected $casts = [
        'suhu' => 'float',
        'kelembapan' => 'integer',
        'arah_angin_derajat' => 'integer',
        'jarak_pandang' => 'integer',
        'tutupan_awan' => 'integer',
        'berlaku_pada' => 'datetime',
    ];

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
