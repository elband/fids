<?php

namespace App\Models;

use App\Models\Concerns\BustsTaxiCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class TaxiCounter extends Model
{
    use BustsTaxiCache;

    /** Simbol panah yang boleh dipilih operator untuk kartu counter. */
    public const ARROWS = ['→', '←', '↑', '↓', '↗', '↖', '↘', '↙'];

    protected $fillable = [
        'nomor', 'nama_operator', 'jenis_layanan', 'arah', 'is_active', 'order_index',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order_index' => 'integer',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
