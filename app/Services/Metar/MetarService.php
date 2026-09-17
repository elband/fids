<?php

namespace App\Services\Metar;

use App\Models\DisplaySetting;
use App\Models\MetarReport;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Menarik METAR sesuai Pengaturan Layar FIDS lalu menyimpan hasil atau alasan
 * kegagalannya. Dipakai command terjadwal dan tombol "Tarik Sekarang" di admin.
 */
class MetarService
{
    public const CACHE_KEY = 'fids:api:metar';

    public function __construct(private BmkgAviationMetarScraper $scraper)
    {
    }

    /**
     * @return MetarReport|null null bila penarikan METAR dinonaktifkan.
     */
    public function refresh(?DisplaySetting $setting = null): ?MetarReport
    {
        $setting ??= DisplaySetting::first();

        if (! $setting || ! $setting->metar_aktif) {
            return null;
        }

        $icao = strtoupper(trim((string) $setting->metar_icao)) ?: 'XXXX';
        // Waktu disimpan dalam zona waktu aplikasi: Eloquent menulis Carbon apa adanya
        // tetapi membacanya kembali dengan config('app.timezone'), sehingga objek UTC
        // akan tampil meleset sebesar offset zona waktu (8 jam di WITA).
        $appTz = config('app.timezone');
        $now = CarbonImmutable::now($appTz);

        $report = MetarReport::firstOrNew(['icao' => $icao]);
        $report->last_attempt_at = $now;

        try {
            $data = $this->scraper->fetchLatest((string) $setting->metar_url, $icao, $now->setTimezone('UTC'));
            unset($data['icao']);
            $data['observed_at'] = $data['observed_at']->setTimezone($appTz);

            $report->fill($data);
            $report->last_success_at = $now;
            $report->error_code = null;
            $report->error_message = null;
        } catch (MetarFetchException $e) {
            // Pengamatan terakhir yang berhasil sengaja dipertahankan.
            $report->error_code = $e->reason;
            $report->error_message = $e->getMessage();
            Log::warning("FIDS METAR {$icao}: {$e->getMessage()}");
        }

        $report->save();
        Cache::forget(self::CACHE_KEY);

        return $report;
    }
}
