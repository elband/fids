<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Airline extends Model
{
    protected $fillable = ['kode_maskapai', 'nama_maskapai', 'logo', 'warna_identitas', 'status_aktif'];

    protected $casts = [
        'status_aktif' => 'boolean',
    ];

    public function flights()
    {
        return $this->hasMany(Flight::class);
    }

    public function checkinCounters()
    {
        return $this->hasMany(CheckinCounter::class);
    }
}
