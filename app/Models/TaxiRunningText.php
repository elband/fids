<?php

namespace App\Models;

use App\Models\Concerns\BustsTaxiCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class TaxiRunningText extends Model
{
    use BustsTaxiCache;

    protected $fillable = [
        'pesan', 'pesan_en', 'warna', 'prioritas',
        'mulai_at', 'selesai_at', 'is_active',
    ];

    protected $casts = [
        'mulai_at' => 'datetime',
        'selesai_at' => 'datetime',
        'is_active' => 'boolean',
        'prioritas' => 'integer',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /** Pesan yang sedang dalam jendela jadwalnya (kolom kosong = tanpa batas). */
    public function scopeScheduledFor(Builder $query, ?Carbon $moment = null): Builder
    {
        $moment = $moment ?? now();

        return $query
            ->where(fn ($q) => $q->whereNull('mulai_at')->orWhere('mulai_at', '<=', $moment))
            ->where(fn ($q) => $q->whereNull('selesai_at')->orWhere('selesai_at', '>=', $moment));
    }
}
