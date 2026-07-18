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

    /**
     * Waktu sekarang pada zona waktu tampilan FIDS.
     * Gunakan ini (bukan Carbon::now()) di scheduler & query "hari ini"
     * agar batas tengah malam konsisten dengan yang dilihat layar.
     */
    public static function now(): \Carbon\Carbon
    {
        return \Carbon\Carbon::now(self::get());
    }

    /**
     * Tanggal "hari ini" (Y-m-d) menurut zona waktu tampilan FIDS.
     */
    public static function today(): \Carbon\Carbon
    {
        return self::now()->startOfDay();
    }
}
