<?php

namespace App\Models;

use App\Models\Concerns\BustsTaxiCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class TaxiVideo extends Model
{
    use BustsTaxiCache;

    protected $fillable = [
        'judul', 'file_path', 'thumbnail_path', 'durasi_detik',
        'playlist', 'hari', 'is_active', 'order_index',
    ];

    protected $casts = [
        'hari' => 'array',
        'is_active' => 'boolean',
        'durasi_detik' => 'integer',
        'order_index' => 'integer',
        'play_count' => 'integer',
        'total_play_seconds' => 'integer',
        'last_played_at' => 'datetime',
    ];

    /** Nama playlist untuk sebuah jam: pagi 04-11, siang 11-18, malam sisanya. */
    public static function playlistForHour(int $hour): string
    {
        return match (true) {
            $hour >= 4 && $hour < 11 => 'pagi',
            $hour >= 11 && $hour < 18 => 'siang',
            default => 'malam',
        };
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /** Video untuk playlist jam operasional saat ini ('all' selalu ikut). */
    public function scopeForMoment(Builder $query, Carbon $moment): Builder
    {
        return $query->whereIn('playlist', ['all', self::playlistForHour((int) $moment->format('G'))]);
    }

    /** Batasan hari (0=Minggu..6=Sabtu); kosong berarti berlaku setiap hari. */
    public function airsOn(Carbon $moment): bool
    {
        $days = $this->hari;

        return empty($days) || in_array((int) $moment->dayOfWeek, array_map('intval', $days), true);
    }
}
