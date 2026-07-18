<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\WeatherInfo;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;

class FetchBmkgWeather extends Command
{
    protected $signature = 'fids:fetch-weather';
    protected $description = 'Fetch weather data from BMKG JSON API';

    public function handle()
    {
        $setting = \App\Models\DisplaySetting::first();
        $kodeBmkg = $setting->kode_bmkg ?? '64.72.09.1004'; // Fallback to default if not set
        
        $url = "https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={$kodeBmkg}";
        
        $this->info("Fetching weather from BMKG JSON API...");
        
        try {
            // Try with full browser-like headers
            $response = Http::withoutVerifying()
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept' => 'application/json, text/plain, */*',
                    'Accept-Language' => 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Referer' => 'https://www.bmkg.go.id/',
                    'Origin' => 'https://www.bmkg.go.id',
                ])->get($url);
            
            if (!$response->successful()) {
                // Gagal diam-diam sebelumnya (hanya ke konsol). Sekarang dicatat ke log
                // agar admin bisa tahu cuaca berhenti update, bukan menyangka data OK.
                $msg = "BMKG request gagal (HTTP {$response->status()}) untuk adm4={$kodeBmkg}.";
                $this->error($msg);
                Log::warning("FIDS weather: {$msg}");
                return 1;
            }

            $data = $response->json();

            if (!$data || !isset($data['data'][0]['cuaca'])) {
                $msg = "Struktur JSON BMKG tidak valid untuk adm4={$kodeBmkg}.";
                $this->error($msg);
                Log::warning("FIDS weather: {$msg}");
                return 1;
            }

            $allForecasts = [];
            foreach ($data['data'][0]['cuaca'] as $group) {
                foreach ($group as $f) {
                    $allForecasts[] = $f;
                }
            }

            // Nama lokasi diambil dari respons BMKG sesuai kode adm4 yang dikonfigurasi,
            // bukan hardcode 'Samarinda' (yang jadi salah begitu kode_bmkg diubah).
            $lokasiData = $data['data'][0]['lokasi'] ?? [];
            $lokasi = $lokasiData['desa']
                ?? $lokasiData['kecamatan']
                ?? $lokasiData['kotkab']
                ?? 'BMKG';

            // Bandingkan dalam UTC pakai field 'datetime' (UTC) bila ada; hindari asumsi
            // zona waktu stasiun. Fallback ke local_datetime pada zona waktu tampilan FIDS.
            $now = Carbon::now('UTC');
            $currentForecast = null;
            $minDiff = PHP_INT_MAX;

            foreach ($allForecasts as $f) {
                if (!empty($f['datetime'])) {
                    $forecastTime = Carbon::parse($f['datetime'], 'UTC');
                } elseif (!empty($f['local_datetime'])) {
                    $forecastTime = Carbon::parse($f['local_datetime'], \App\Support\DisplayTimezone::get())->setTimezone('UTC');
                } else {
                    continue;
                }
                $diff = abs((int) $now->diffInMinutes($forecastTime));

                if ($diff < $minDiff) {
                    $minDiff = $diff;
                    $currentForecast = $f;
                }
            }

            if ($currentForecast) {
                WeatherInfo::updateOrCreate(
                    ['lokasi' => $lokasi],
                    [
                        'suhu' => (float)$currentForecast['t'],
                        'kondisi_cuaca' => $currentForecast['weather_desc'],
                        'kelembapan' => (int)$currentForecast['hu'],
                        'kecepatan_angin' => (float)$currentForecast['ws'],
                        'arah_angin' => isset($currentForecast['wd']) ? (string)$currentForecast['wd'] : null,
                        'arah_angin_derajat' => isset($currentForecast['wd_deg']) ? (int)$currentForecast['wd_deg'] : null,
                    ]
                );
                $this->info("Successfully updated weather: {$currentForecast['weather_desc']}, {$currentForecast['t']}°C");
            }

        } catch (\Throwable $e) {
            $this->error("Error: " . $e->getMessage());
            Log::error("FIDS weather: gagal mengambil data BMKG - " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
