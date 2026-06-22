<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Flight;
use App\Models\Announcement;
use App\Models\WeatherInfo;
use App\Models\DisplaySetting;
use App\Http\Resources\FlightResource;
use App\Http\Resources\SettingResource;
use App\Http\Resources\WeatherResource;
use App\Http\Resources\AnnouncementResource;
use App\Models\NtpSetting;
use App\Models\WorldClockSetting;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class DisplayApiController extends Controller
{
    /**
     * TTL cache respons display (audit M-03). Layar polling ~10 dtk, jadi TTL
     * pendek aman: N monitor runtuh menjadi ~1 kueri DB per TTL. Bekerja dengan
     * cache driver apa pun (database saat ini; optimal dengan Redis).
     */
    private const TTL_LIST = 5;      // daftar penerbangan/counter (sering berubah)
    private const TTL_SETTINGS = 15; // setting/cuaca/world-clock (jarang berubah)

    public function departures()
    {
        $data = Cache::remember('fids:api:departures', self::TTL_LIST, function () {
            $flights = Flight::with(['airline', 'airportTujuan', 'gate', 'checkinCounters'])
                ->departure()->daily()->today()
                ->orderBy('jam_jadwal', 'asc')
                ->get();
            return FlightResource::collection($flights)->resolve();
        });

        return response()->json(['data' => $data]);
    }

    public function arrivals()
    {
        $data = Cache::remember('fids:api:arrivals', self::TTL_LIST, function () {
            $flights = Flight::with(['airline', 'airportAsal', 'baggageClaim'])
                ->arrival()->daily()->today()
                ->orderBy('jam_jadwal', 'asc')
                ->get();
            return FlightResource::collection($flights)->resolve();
        });

        return response()->json(['data' => $data]);
    }

    public function gate($gateCode)
    {
        $gate = \App\Models\Gate::with(['flights' => function($q) {
            $q->daily()
              ->today()
              ->whereIn('status', ['Scheduled', 'Boarding', 'Gate Open', 'Final Call', 'Delayed'])
              ->orderBy('jam_jadwal', 'asc');
        }, 'flights.airline', 'flights.airportTujuan'])
        ->where(function ($q) use ($gateCode) {
            $q->where('kode_gate', $gateCode);
            // Numeric-aware fallback: "1" cocok dengan "01" di DB.
            if (ctype_digit((string) $gateCode)) {
                $q->orWhereRaw('CAST(kode_gate AS UNSIGNED) = ?', [(int) $gateCode]);
            }
        })
        ->first();
            
        if (!$gate) return response()->json(['message' => 'Not found'], 404);

        $arr = $gate->toArray();
        $arr['flights'] = FlightResource::collection($gate->flights)->resolve();

        return response()->json(['data' => $arr]);
    }

    public function checkin($counterNumber)
    {
        $counter = \App\Models\CheckinCounter::with(['airline', 'flights' => function($q) {
            $q->daily()
              ->today()
              ->whereIn('status', ['Scheduled', 'Check-in Open', 'Check-in Closed', 'Delayed'])
              ->with('checkinCounters')
              ->orderBy('jam_jadwal', 'asc');
        }, 'flights.airline', 'flights.airportTujuan'])
        ->where(function ($q) use ($counterNumber) {
            $q->where('nomor_counter', $counterNumber);
            if (ctype_digit((string) $counterNumber)) {
                $q->orWhereRaw('CAST(nomor_counter AS UNSIGNED) = ?', [(int) $counterNumber]);
            }
        })
        ->first();
            
        if (!$counter) return response()->json(['message' => 'Not found'], 404);

        $arr = $counter->toArray();
        $arr['flights'] = FlightResource::collection($counter->flights)->resolve();

        if ($counter->airline && $counter->airline->logo) {
            $arr['airline']['logo'] = '/storage/' . $counter->airline->logo;
        }

        $arr['idle_image'] = $counter->idle_image ? '/storage/' . $counter->idle_image : null;

        return response()->json(['data' => $arr]);
    }

    public function baggage($beltNumber)
    {
        $belt = \App\Models\BaggageClaim::with(['flights' => function($q) {
            $q->daily()
              ->today()
              ->whereIn('status', ['Scheduled', 'Landed', 'Arrived', 'Baggage Claim', 'Delayed'])
              ->orderBy('jam_jadwal', 'asc');
        }, 'flights.airline', 'flights.airportAsal'])
        ->where(function ($q) use ($beltNumber) {
            $q->where('nomor_belt', $beltNumber);
            if (ctype_digit((string) $beltNumber)) {
                $q->orWhereRaw('CAST(nomor_belt AS UNSIGNED) = ?', [(int) $beltNumber]);
            }
        })
        ->first();
            
        if (!$belt) return response()->json(['message' => 'Not found'], 404);

        $arr = $belt->toArray();
        $arr['flights'] = FlightResource::collection($belt->flights)->resolve();

        return response()->json(['data' => $arr]);
    }

    /**
     * Dipanggil oleh layar publik setelah sebuah pengumuman selesai diputar.
     * Menaikkan broadcast_count dan menghapus pengumuman bila sudah mencapai batas.
     * Endpoint publik (tanpa auth/CSRF) agar layar kiosk yang tidak login tetap bisa melapor.
     */
    public function markAnnouncementPlayed(Announcement $announcement)
    {
        $announcement->increment('broadcast_count');

        // Audit C-03: endpoint publik ini TIDAK menghapus data secara permanen.
        // Saat mencapai batas, pengumuman hanya dinonaktifkan (status_aktif=false) agar
        // tidak hilang dari antrian pending; pembersihan permanen dilakukan oleh proses
        // terotentikasi di Admin (PublicAnnouncementController@index).
        $reachedLimit = $announcement->broadcast_count >= $announcement->max_broadcasts;

        $announcement->update([
            'last_broadcast_at' => now(),
            'status_aktif'      => $reachedLimit ? false : $announcement->status_aktif,
        ]);

        return response()->json([
            'success'         => true,
            'finished'        => $reachedLimit,
            'broadcast_count' => $announcement->broadcast_count,
            'max_broadcasts'  => $announcement->max_broadcasts,
        ]);
    }

    public function announcements()
    {
        $data = Cache::remember('fids:api:announcements', self::TTL_LIST, function () {
            $now = Carbon::now();
            $announcements = Announcement::where('status_aktif', true)
                ->where('mulai_tayang', '<=', $now)
                ->where(function($q) use ($now) {
                    $q->whereNull('selesai_tayang')
                      ->orWhere('selesai_tayang', '>=', $now);
                })
                ->orderBy('prioritas', 'desc')
                ->get();
            return AnnouncementResource::collection($announcements)->resolve();
        });

        return response()->json(['data' => $data]);
    }

    public function weather()
    {
        $data = Cache::remember('fids:api:weather', self::TTL_SETTINGS, function () {
            $weather = WeatherInfo::latest()->first();
            return $weather ? (new WeatherResource($weather))->resolve() : null;
        });

        return response()->json(['data' => $data]);
    }

    public function settings()
    {
        $data = Cache::remember('fids:api:settings', self::TTL_SETTINGS, function () {
            $setting = DisplaySetting::first();
            return $setting ? (new SettingResource($setting))->resolve() : null;
        });

        return response()->json(['data' => $data]);
    }

    public function allCheckinCounters()
    {
        $data = Cache::remember('fids:api:checkin-counters', self::TTL_LIST, function () {
            $counters = \App\Models\CheckinCounter::with(['airline', 'flights' => function($q) {
                $q->daily()
                  ->today()
                  ->whereIn('status', ['Scheduled', 'Check-in Open', 'Check-in Closed', 'Delayed'])
                  ->with('checkinCounters')
                  ->orderBy('jam_jadwal', 'asc');
            }])->orderBy('nomor_counter', 'asc')->get();

            return $counters->map(function ($counter) {
                $arr = $counter->toArray();
                if ($counter->airline && $counter->airline->logo) {
                    $arr['airline']['logo'] = '/storage/' . $counter->airline->logo;
                }
                $arr['idle_image'] = $counter->idle_image ? '/storage/' . $counter->idle_image : null;
                $arr['flights'] = FlightResource::collection($counter->flights)->resolve();
                return $arr;
            })->all();
        });

        return response()->json(['data' => $data]);
    }

    public function allGates()
    {
        $data = Cache::remember('fids:api:gates', self::TTL_LIST, function () {
            $gates = \App\Models\Gate::with(['flights' => function($q) {
                $q->daily()
                  ->today()
                  ->where('jenis_penerbangan', 'departure')
                  ->whereIn('status', ['Scheduled', 'Check-in Open', 'Boarding', 'Gate Open', 'Final Call', 'Delayed', 'Departed'])
                  ->with('checkinCounters')
                  ->orderBy('jam_jadwal', 'asc');
            }, 'flights.airline'])->orderBy('kode_gate', 'asc')->get();

            return $gates->map(function ($gate) {
                $arr = $gate->toArray();
                $arr['flights'] = FlightResource::collection($gate->flights)->resolve();
                return $arr;
            })->all();
        });

        return response()->json(['data' => $data]);
    }

    public function allBaggageClaims()
    {
        $data = Cache::remember('fids:api:baggage-claims', self::TTL_LIST, function () {
            $claims = \App\Models\BaggageClaim::with(['flights' => function($q) {
                $q->daily()
                  ->today()
                  ->where('jenis_penerbangan', 'arrival')
                  ->whereIn('status', ['Scheduled', 'Landed', 'Arrived', 'Baggage Claim', 'Delayed'])
                  ->orderBy('jam_jadwal', 'asc');
            }, 'flights.airline'])->orderBy('nomor_belt', 'asc')->get();

            return $claims->map(function ($claim) {
                $arr = $claim->toArray();
                $arr['flights'] = FlightResource::collection($claim->flights)->resolve();
                return $arr;
            })->all();
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Mengembalikan waktu server yang terkoreksi NTP + timezone dari pengaturan.
     * Digunakan oleh frontend sebagai sumber waktu utama untuk semua display.
     */
    public function time()
    {
        $ntpSetting = NtpSetting::first();
        $displaySetting = DisplaySetting::first();
        $timezone = $displaySetting?->timezone ?? config('app.timezone', 'UTC');

        // Waktu server saat ini (UTC)
        $serverUtcNow = Carbon::now('UTC');

        // Jika ada NTP offset, koreksi waktu server
        $offsetMs = 0;
        $ntpStatus = 'unavailable';
        $ntpServer = null;

        if ($ntpSetting && $ntpSetting->last_sync_status === 'success' && $ntpSetting->last_offset_ms !== null) {
            $offsetMs = (float) $ntpSetting->last_offset_ms;
            $ntpStatus = 'synced';
            $ntpServer = $ntpSetting->last_server_used;

            // Terapkan offset NTP ke waktu server
            $serverUtcNow = $serverUtcNow->addMilliseconds((int) round($offsetMs));
        }

        // Konversi ke timezone display
        $displayTime = $serverUtcNow->copy()->setTimezone($timezone);

        return response()->json([
            'data' => [
                'utc_now' => $serverUtcNow->toIso8601String(),
                'display_time' => $displayTime->toIso8601String(),
                'timezone' => $timezone,
                'bahasa' => $displaySetting?->bahasa ?? 'id',
                'ntp_offset_ms' => $offsetMs,
                'ntp_status' => $ntpStatus,
                'ntp_server' => $ntpServer,
                'last_sync_at' => $ntpSetting?->last_sync_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Mengembalikan pengaturan World Clock Display.
     */
    public function worldClockSettings()
    {
        $setting = WorldClockSetting::first();
        $displaySetting = DisplaySetting::first();

        if (!$setting) {
            $setting = new WorldClockSetting([
                'show_utc' => true,
                'show_wib' => true,
                'show_wita' => true,
                'show_wit' => true,
                'format_waktu' => '24h',
                'show_seconds' => true,
                'show_date' => true,
                'tema_warna' => '#0f172a',
                'accent_color' => '#3b82f6',
                'show_nama_bandara' => true,
                'show_analog_clock' => false,
                'show_ntp_status' => true,
            ]);
        }

        $data = $setting->toArray();
        $data['nama_bandara'] = $displaySetting?->nama_bandara ?? null;
        $data['bahasa'] = $displaySetting?->bahasa ?? 'id';
        $data['background_header_url'] = null;
        if ($setting->use_background_image && $displaySetting?->background_header) {
            $data['background_header_url'] = \Storage::url($displaySetting->background_header);
        }

        return response()->json(['data' => $data]);
    }
}
