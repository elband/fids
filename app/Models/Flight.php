<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Flight extends Model
{
    /**
     * Cache API layar publik yang bergantung pada data flight.
     * Di-forget setiap kali flight berubah agar layar tidak menunggu TTL.
     */
    private const FLIGHT_DEPENDENT_CACHE_KEYS = [
        'fids:api:departures',
        'fids:api:arrivals',
        'fids:api:checkin-counters',
        'fids:api:gates',
        'fids:api:baggage-claims',
    ];

    protected static function booted(): void
    {
        // Bersihkan cache saat flight dibuat/diubah/dihapus, dari controller manapun,
        // sehingga perubahan status/gate langsung tampil di layar pada polling berikutnya.
        $flush = function () {
            foreach (self::FLIGHT_DEPENDENT_CACHE_KEYS as $key) {
                Cache::forget($key);
            }
            // Cache endpoint detail (per gate/counter/belt) memakai key ber-versi.
            // Bump versi = seluruh cache detail lama otomatis tak terpakai (instan),
            // tanpa perlu menghapus tiap key per-parameter satu-satu.
            Cache::add('fids:api:flight-ver', 0);
            Cache::increment('fids:api:flight-ver');
        };
        static::saved($flush);
        static::deleted($flush);
    }

    protected $fillable = [
        'is_master', 'hari_operasi', 'frekuensi_per_minggu',
        'tanggal_penerbangan', 'nomor_penerbangan', 'airline_id', 'airport_asal_id',
        'airport_tujuan_id', 'jam_jadwal', 'jam_estimasi', 'jam_aktual',
        'jenis_penerbangan', 'tipe_layanan', 'gate_id', 'checkin_counter_id',
        'baggage_claim_id', 'status', 'catatan', 'created_by', 'updated_by'
    ];

    protected $casts = [
        'tanggal_penerbangan' => 'date:Y-m-d',
        'is_master' => 'boolean',
        'hari_operasi' => 'array',
        'frekuensi_per_minggu' => 'integer',
    ];

    // Scopes
    public function scopeToday($query)
    {
        $timezone = \App\Support\DisplayTimezone::get();
        return $query->whereDate('tanggal_penerbangan', \Carbon\Carbon::now($timezone)->toDateString());
    }

    public function scopeMaster($query)
    {
        return $query->where('is_master', true);
    }

    public function scopeDaily($query)
    {
        return $query->where('is_master', false);
    }

    public function scopeDeparture($query)
    {
        return $query->where('jenis_penerbangan', 'departure');
    }

    public function scopeArrival($query)
    {
        return $query->where('jenis_penerbangan', 'arrival');
    }

    public function airline()
    {
        return $this->belongsTo(Airline::class);
    }

    public function airportAsal()
    {
        return $this->belongsTo(Airport::class, 'airport_asal_id');
    }

    public function airportTujuan()
    {
        return $this->belongsTo(Airport::class, 'airport_tujuan_id');
    }

    public function gate()
    {
        return $this->belongsTo(Gate::class);
    }

    public function checkinCounter()
    {
        return $this->belongsTo(CheckinCounter::class);
    }

    public function checkinCounters()
    {
        return $this->belongsToMany(CheckinCounter::class, 'flight_checkin_counter');
    }

    public function baggageClaim()
    {
        return $this->belongsTo(BaggageClaim::class);
    }

    public function statusLogs()
    {
        return $this->hasMany(FlightStatusLog::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
