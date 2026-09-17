<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DisplaySetting;
use App\Models\MetarReport;
use App\Services\Metar\MetarService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

/**
 * METAR bandara untuk layar AMC, lengkap dengan status penarikan.
 *
 * `problem` berisi alasan yang siap ditampilkan bila data tidak bisa dipercaya:
 * penarikan gagal, scheduler berhenti, atau stasiun tidak mengirim laporan baru.
 */
class MetarApiController extends Controller
{
    /** Scheduler menarik tiap 30 menit; lewat dari ini berarti jadwal tidak berjalan. */
    public const SCHEDULER_LATE_MINUTES = 45;

    /** METAR rutin terbit tiap 30 menit; lewat dari ini laporannya dianggap basi. */
    public const OBSERVATION_STALE_MINUTES = 90;

    public function show(): JsonResponse
    {
        $data = Cache::remember(MetarService::CACHE_KEY, 30, fn () => $this->payload(CarbonImmutable::now('UTC')));

        return response()->json(['data' => $data]);
    }

    /** @return array<string, mixed> */
    public function payload(CarbonImmutable $now): array
    {
        $setting = DisplaySetting::first();

        if (! $setting || ! $setting->metar_aktif) {
            return ['enabled' => false, 'icao' => null, 'report' => null, 'problem' => null];
        }

        $icao = strtoupper(trim((string) $setting->metar_icao));
        $host = parse_url((string) $setting->metar_url, PHP_URL_HOST) ?: 'portal BMKG';
        $report = $icao !== '' ? MetarReport::where('icao', $icao)->first() : null;

        return [
            'enabled' => true,
            'icao' => $icao ?: null,
            'source' => $host,
            'report' => $report && $report->raw_text ? $this->reportData($report) : null,
            'last_attempt_at' => $report?->last_attempt_at?->toIso8601String(),
            'last_success_at' => $report?->last_success_at?->toIso8601String(),
            'problem' => $this->problem($report, $icao, $host, $now),
        ];
    }

    /** @return array<string, mixed> */
    private function reportData(MetarReport $r): array
    {
        return [
            'raw_text' => $r->raw_text,
            'observed_at' => $r->observed_at?->toIso8601String(),
            'wind_dir_deg' => $r->wind_dir_deg,
            'wind_variable' => $r->wind_variable,
            'wind_var_from' => $r->wind_var_from,
            'wind_var_to' => $r->wind_var_to,
            'wind_speed_kt' => $r->wind_speed_kt,
            'wind_gust_kt' => $r->wind_gust_kt,
            'visibility_m' => $r->visibility_m,
            'present_weather' => $r->present_weather,
            'clouds' => $r->clouds,
            'temperature_c' => $r->temperature_c,
            'dew_point_c' => $r->dew_point_c,
            'qnh_hpa' => $r->qnh_hpa,
            'trend' => $r->trend,
        ];
    }

    /** @return array{code: string, message: string}|null */
    private function problem(?MetarReport $report, string $icao, string $host, CarbonImmutable $now): ?array
    {
        if ($icao === '') {
            return ['code' => 'konfigurasi', 'message' => 'Kode ICAO stasiun METAR belum diisi di Pengaturan Layar FIDS.'];
        }

        if (! $report || ! $report->last_attempt_at) {
            return [
                'code' => 'belum',
                'message' => "Data METAR {$icao} belum pernah ditarik dari {$host}. Pastikan scheduler server berjalan, atau tekan \"Tarik Sekarang\" di Pengaturan Layar FIDS.",
            ];
        }

        $attemptAge = (int) $report->last_attempt_at->diffInMinutes($now, true);
        if ($attemptAge > self::SCHEDULER_LATE_MINUTES) {
            return [
                'code' => 'scheduler',
                'message' => "Penarikan otomatis METAR berhenti: percobaan terakhir {$attemptAge} menit lalu (seharusnya tiap 30 menit). Periksa cron scheduler Laravel di server.",
            ];
        }

        if ($report->error_code) {
            return ['code' => $report->error_code, 'message' => "METAR {$icao} tidak bisa ditarik: {$report->error_message}"];
        }

        if ($report->observed_at) {
            $obsAge = (int) $report->observed_at->diffInMinutes($now, true);
            if ($obsAge > self::OBSERVATION_STALE_MINUTES) {
                $jam = $report->observed_at->format('H:i');

                return [
                    'code' => 'basi',
                    'message' => "METAR terbaru {$icao} dari {$host} tercatat pukul {$jam} UTC ({$obsAge} menit lalu). Stasiun belum mengirim laporan baru.",
                ];
            }
        }

        return null;
    }
}
