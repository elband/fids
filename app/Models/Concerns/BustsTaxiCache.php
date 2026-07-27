<?php

namespace App\Models\Concerns;

use Illuminate\Support\Facades\Cache;

/**
 * Konten signage taksi di-cache pendek di API (lihat App\Support\TaxiSignage).
 * Setiap kali datanya berubah lewat admin, cache dibuang agar layar tidak
 * menunggu TTL habis.
 */
trait BustsTaxiCache
{
    public static function bootBustsTaxiCache(): void
    {
        $bump = fn () => Cache::forget(\App\Support\TaxiSignage::CONTENT_CACHE_KEY);

        static::saved($bump);
        static::deleted($bump);
    }
}
