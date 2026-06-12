<?php

namespace App\Support;

use App\Models\DisplaySetting;

class DisplayTimezone
{
    /**
     * Ambil zona waktu yang aktif untuk tampilan FIDS.
     * Sumber utama: DisplaySetting->timezone, fallback ke config('app.timezone').
     */
    public static function get(): string
    {
        static $cached = null;
        if ($cached !== null) {
            return $cached;
        }

        try {
            $tz = optional(DisplaySetting::first())->timezone;
        } catch (\Throwable $e) {
            $tz = null;
        }

        $cached = $tz ?: (string) config('app.timezone', 'UTC');
        return $cached;
    }
}
