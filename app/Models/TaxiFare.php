<?php

namespace App\Models;

use App\Models\Concerns\BustsTaxiCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class TaxiFare extends Model
{
    use BustsTaxiCache;

    /** Selama N hari sejak tarif berubah, layar menyorotnya sebagai "tarif baru". */
    public const HIGHLIGHT_DAYS = 7;

    protected $fillable = [
        'wilayah', 'tujuan', 'jenis_kendaraan', 'tarif', 'tarif_sebelumnya',
        'berlaku_mulai', 'berlaku_sampai', 'is_active', 'order_index',
    ];

    protected $casts = [
        'tarif' => 'integer',
        'tarif_sebelumnya' => 'integer',
        'berlaku_mulai' => 'date:Y-m-d',
        'berlaku_sampai' => 'date:Y-m-d',
        'is_active' => 'boolean',
        'order_index' => 'integer',
    ];

    protected static function booted(): void
    {
        // Simpan tarif lama otomatis supaya perubahan bisa disorot di layar
        // tanpa operator perlu mengisinya manual.
        static::updating(function (self $fare) {
            if ($fare->isDirty('tarif') && ! $fare->isDirty('tarif_sebelumnya')) {
                $fare->tarif_sebelumnya = $fare->getOriginal('tarif');
            }
        });
    }

    /**
     * Tarif yang berlaku pada tanggal tertentu (penjadwalan tarif).
     * Kolom tanggal yang kosong berarti tidak dibatasi.
     */
    public function scopeEffectiveOn(Builder $query, ?Carbon $date = null): Builder
    {
        $date = ($date ?? now())->toDateString();

        return $query
            ->where(fn ($q) => $q->whereNull('berlaku_mulai')->orWhereDate('berlaku_mulai', '<=', $date))
            ->where(fn ($q) => $q->whereNull('berlaku_sampai')->orWhereDate('berlaku_sampai', '>=', $date));
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /** Tarif baru berubah dalam HIGHLIGHT_DAYS terakhir. */
    public function isRecentlyChanged(): bool
    {
        return $this->tarif_sebelumnya !== null
            && $this->tarif_sebelumnya !== $this->tarif
            && (bool) $this->updated_at?->gte(now()->subDays(self::HIGHLIGHT_DAYS));
    }
}
