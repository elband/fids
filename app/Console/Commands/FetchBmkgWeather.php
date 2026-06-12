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
                // If blocked, try a very simple fallback to at least not crash
                $this->error("Access blocked by BMKG (403/401).");
                return 1;
            }

            $data = $response->json();
            
            if (!$data || !isset($data['data'][0]['cuaca'])) {
                $this->error("Invalid JSON structure.");
                return 1;
            }

            $allForecasts = [];
            foreach ($data['data'][0]['cuaca'] as $group) {
                foreach ($group as $f) {
                    $allForecasts[] = $f;
                }
            }

            $now = Carbon::now('Asia/Makassar');
            $currentForecast = null;
            $minDiff = 9999999;

            foreach ($allForecasts as $f) {
                $forecastTime = Carbon::parse($f['local_datetime'], 'Asia/Makassar');
                $diff = abs($now->diffInMinutes($forecastTime));
                
                if ($diff < $minDiff) {
                    $minDiff = $diff;
                    $currentForecast = $f;
                }
            }

            if ($currentForecast) {
                WeatherInfo::updateOrCreate(
                    ['lokasi' => 'Samarinda'],
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

        } catch (\Exception $e) {
            $this->error("Error: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
