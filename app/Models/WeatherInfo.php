<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WeatherInfo extends Model
{
    protected $fillable = ['lokasi', 'suhu', 'kondisi_cuaca', 'kelembapan', 'kecepatan_angin', 'arah_angin', 'arah_angin_derajat', 'updated_by'];

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
