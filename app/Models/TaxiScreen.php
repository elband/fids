<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaxiScreen extends Model
{
    /** Layar dianggap offline bila tidak mengirim heartbeat selama ini. */
    public const OFFLINE_AFTER_SECONDS = 90;

    protected $fillable = [
        'kode', 'nama', 'lokasi', 'ip_address', 'resolusi', 'last_seen_at',
    ];

    protected $casts = [
        'last_seen_at' => 'datetime',
    ];

    public function isOnline(): bool
    {
        return (bool) $this->last_seen_at?->gte(now()->subSeconds(self::OFFLINE_AFTER_SECONDS));
    }
}
