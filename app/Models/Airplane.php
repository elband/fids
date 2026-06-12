<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Airplane extends Model
{
    protected $fillable = ['airline_id', 'nomor_registrasi', 'tipe_pesawat', 'kapasitas', 'status_aktif'];

    protected $casts = [
        'status_aktif' => 'boolean',
    ];

    public function airline()
    {
        return $this->belongsTo(Airline::class);
    }
}
