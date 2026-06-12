<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Route extends Model
{
    protected $fillable = ['airport_asal_id', 'airport_tujuan_id', 'tipe_layanan', 'jenis_rute', 'status_aktif'];

    protected $casts = [
        'status_aktif' => 'boolean',
    ];

    public function airportAsal()
    {
        return $this->belongsTo(Airport::class, 'airport_asal_id');
    }

    public function airportTujuan()
    {
        return $this->belongsTo(Airport::class, 'airport_tujuan_id');
    }
}
