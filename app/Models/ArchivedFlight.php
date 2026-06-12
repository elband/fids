<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArchivedFlight extends Model
{
    protected $fillable = [
        'original_flight_id', 'tanggal_penerbangan', 'nomor_penerbangan', 'airline_id', 'airport_asal_id',
        'airport_tujuan_id', 'jam_jadwal', 'jam_estimasi', 'jam_aktual',
        'jenis_penerbangan', 'tipe_layanan', 'gate_id', 'checkin_counter_id',
        'baggage_claim_id', 'status', 'catatan', 'archived_at'
    ];

    protected $casts = [
        'tanggal_penerbangan' => 'date',
        'archived_at' => 'datetime',
    ];
}
