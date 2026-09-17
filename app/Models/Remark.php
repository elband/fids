<?php

namespace App\Models;

use App\Support\FlightStatus;
use Illuminate\Database\Eloquent\Model;

/**
 * Master remark = daftar status penerbangan yang dapat dipilih petugas.
 * Remark `is_system` mewakili status inti (FlightStatus::ALL) yang dibaca layar publik.
 */
class Remark extends Model
{
    protected $fillable = ['kode', 'nama_remark', 'status_aktif'];

    protected $casts = [
        'status_aktif' => 'boolean',
        'is_system' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('status_aktif', true);
    }

    /**
     * Nama status aktif untuk dropdown: status inti mengikuti urutan alur
     * FlightStatus::ALL, remark tambahan menyusul urut abjad.
     *
     * @return list<string>
     */
    public static function flightStatusOptions(): array
    {
        $order = array_flip(FlightStatus::ALL);

        return static::active()->pluck('nama_remark')
            ->sortBy(fn ($name) => [$order[$name] ?? PHP_INT_MAX, $name])
            ->values()
            ->all();
    }

    /** Jumlah penerbangan yang sedang memakai remark ini sebagai status. */
    public function flightsInUse(): int
    {
        return Flight::where('status', $this->nama_remark)->count();
    }
}
