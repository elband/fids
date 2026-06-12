<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Airport extends Model
{
    protected $fillable = ['kode_iata', 'nama_bandara', 'kota', 'negara', 'status_aktif'];

    protected $casts = [
        'status_aktif' => 'boolean',
    ];

    public function departureRoutes()
    {
        return $this->hasMany(Route::class, 'airport_asal_id');
    }

    public function arrivalRoutes()
    {
        return $this->hasMany(Route::class, 'airport_tujuan_id');
    }

    public function departureFlights()
    {
        return $this->hasMany(Flight::class, 'airport_asal_id');
    }

    public function arrivalFlights()
    {
        return $this->hasMany(Flight::class, 'airport_tujuan_id');
    }
}
