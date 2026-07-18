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
use Illuminate\Support\Facades\DB;
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

    /**
     * Semua relasi yang dibaca FlightResource. Wajib di-eager-load di setiap
     * endpoint agar tidak terjadi N+1 (audit: 6 kueri lazy per flight).
     */
    private const FLIGHT_RELATIONS = [
        'airline', 'airportAsal', 'airportTujuan',
        'gate', 'checkinCounter', 'checkinCounters', 'baggageClaim',
    ];

    /** Versi cache flight saat ini; di-bump oleh Flight::booted() setiap data flight berubah. */
    private function flightCacheVersion(): int
    {
        return (int) Cache::get('fids:api:flight-ver', 0);
    }

    /** Relasi FlightResource dengan prefiks untuk eager-load bersarang (mis. flights.airline). */
    private static function nestedFlightRelations(string $prefix = 'flights'): array
    {
        return array_map(fn ($r) => "{$prefix}.{$r}", self::FLIGHT_RELATIONS);
    }

    /** Menit tampil boarding gate SEBELUM jam jadwal. */
    private const GATE_LEAD_MINUTES = 60;
    /** Menit penerbangan tetap tampil SETELAH berangkat. */
    private const GATE_LINGER_MINUTES = 5;

    /**
     * Tentukan penerbangan yang sedang "memakai" sebuah gate menurut aturan operasional:
     *  - Muncul mulai 1 jam sebelum jam jadwal (GATE_LEAD_MINUTES).
     *  - Hanya SATU penerbangan memakai gate pada satu waktu (yang paling awal jadwalnya);
     *    gate baru bisa dipakai penerbangan berikutnya setelah penghuni sebelumnya hilang.
     *  - Hilang 5 menit setelah statusnya "Departed" (GATE_LINGER_MINUTES).
     *
     * @param  \Illuminate\Support\Collection  $flights  penerbangan hari ini untuk satu gate
     * @return \Illuminate\Support\Collection             berisi 0 atau 1 penerbangan
     */
    private function gateOccupant($flights)
    {
        $tz = \App\Support\DisplayTimezone::get();
        $now = Carbon::now($tz);
        $today = $now->toDateString();

        $eligible = $flights->filter(function ($f) use ($now, $today, $tz) {
            if (empty($f->jam_jadwal)) {
                return false;
            }
            if ($f->status === 'Cancelled') {
                return false;
            }

            $sched = Carbon::parse("{$today} {$f->jam_jadwal}", $tz);

            if ($f->status === 'Departed') {
                // Sudah berangkat: tampil hanya sampai 5 menit setelah waktu berangkat.
                $departedAt = ! empty($f->jam_aktual)
                    ? Carbon::parse("{$today} {$f->jam_aktual}", $tz)
                    : ($f->updated_at ? $f->updated_at->copy()->setTimezone($tz) : $sched);

                return $now->lte($departedAt->copy()->addMinutes(self::GATE_LINGER_MINUTES));
            }

            // Belum berangkat: tampil mulai 1 jam sebelum jam jadwal.
            return $now->gte($sched->copy()->subMinutes(self::GATE_LEAD_MINUTES));
        });

        if ($eligible->isEmpty()) {
            return $eligible;
        }

        // Satu gate hanya dipakai satu penerbangan: penghuni saat ini = jadwal paling awal.
        return collect([$eligible->sortBy('jam_jadwal')->first()]);
    }

    /**
     * Penerbangan yang sedang memakai sebuah check-in counter:
     *  - HANYA tampil bila status penerbangan = "Check-in Open".
     *  - Satu counter dipakai satu penerbangan (jadwal paling awal).
     *
     * @param  \Illuminate\Support\Collection  $flights
     * @return \Illuminate\Support\Collection   berisi 0 atau 1 penerbangan
     */
    private function checkinOccupant($flights)
    {
        $open = $flights->filter(fn ($f) => $f->status === 'Check-in Open');
        if ($open->isEmpty()) {
            return $open;
        }
        return collect([$open->sortBy('jam_jadwal')->first()]);
    }

    /** Status penerbangan yang berarti pesawat sudah tiba (memicu tampil di baggage claim). */
    private const BAGGAGE_ARRIVED_STATUSES = ['Arrived', 'On Time', 'Landed', 'Baggage Claim'];

    /**
     * Waktu tiba penerbangan sebagai Carbon (zona tampilan).
     * Utamakan jam_aktual (ATA) + tanggal; fallback ke updated_at.
     */
    private function flightArrivedAt($flight): ?Carbon
    {
        $tz = \App\Support\DisplayTimezone::get();
        if (! empty($flight->jam_aktual)) {
            $date = $flight->tanggal_penerbangan
                ? Carbon::parse($flight->tanggal_penerbangan)->toDateString()
                : Carbon::now($tz)->toDateString();
            return Carbon::parse("{$date} {$flight->jam_aktual}", $tz);
        }
        return $flight->updated_at ? $flight->updated_at->copy()->setTimezone($tz) : null;
    }

    /**
     * Penerbangan yang sedang memakai sebuah belt baggage claim:
     *  - Status harus "sudah tiba" (BAGGAGE_ARRIVED_STATUSES).
     *  - Masih dalam jendela waktu ($windowMin menit sejak tiba).
     *  - Satu belt = satu penerbangan (kedatangan paling baru).
     *
     * @return \Illuminate\Support\Collection  berisi 0 atau 1 penerbangan
     */
    private function baggageOccupant($flights, int $windowMin)
    {
        $now = Carbon::now(\App\Support\DisplayTimezone::get());

        $eligible = $flights->filter(function ($f) use ($now, $windowMin) {
            if (! in_array($f->status, self::BAGGAGE_ARRIVED_STATUSES, true)) {
                return false;
            }
            $at = $this->flightArrivedAt($f);
            if (! $at) {
                return true; // sudah tiba tapi tanpa waktu → tetap tampil
            }
            return $at->diffInMinutes($now, false) < $windowMin; // menit sejak tiba
        });

        if ($eligible->isEmpty()) {
            return $eligible;
        }

        // Bagasi yang sedang keluar = kedatangan paling baru.
        return collect([
            $eligible->sortByDesc(fn ($f) => optional($this->flightArrivedAt($f))->timestamp ?? 0)->first(),
        ]);
    }

    /** Kamera CCTV aktif yang terhubung ke sebuah belt (atau null). */
    private function beltCamera($belt): ?array
    {
        $cam = \App\Models\CctvCamera::where('baggage_claim_id', $belt->id)
            ->where('aktif', true)
            ->orderBy('urutan')
            ->first();

        if (! $cam) {
            return null;
        }

        return [
            'nama'         => $cam->nama,
            'jenis_stream' => $cam->jenis_stream,
            'url_stream'   => $cam->url_stream,
        ];
    }

    public function departures()
    {
        $data = Cache::remember('fids:api:departures', self::TTL_LIST, function () {
            $flights = Flight::with(self::FLIGHT_RELATIONS)
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
            $flights = Flight::with(self::FLIGHT_RELATIONS)
                ->arrival()->daily()->today()
                ->orderBy('jam_jadwal', 'asc')
                ->get();
            return FlightResource::collection($flights)->resolve();
        });

        return response()->json(['data' => $data]);
    }

    public function gate($gateCode)
    {
        $key = "fids:api:gate:{$gateCode}:v{$this->flightCacheVersion()}";
        $data = Cache::remember($key, self::TTL_LIST, function () use ($gateCode) {
            $gate = \App\Models\Gate::with(['flights' => function($q) {
                $q->daily()
                  ->today()
                  ->whereIn('status', ['Scheduled', 'Check-in Open', 'Boarding', 'Gate Open', 'Final Call', 'Delayed', 'Departed'])
                  ->orderBy('jam_jadwal', 'asc');
            }, ...self::nestedFlightRelations()])
            ->where(function ($q) use ($gateCode) {
                $q->where('kode_gate', $gateCode);
                // Numeric-aware fallback: "1" cocok dengan "01" di DB.
                if (ctype_digit((string) $gateCode)) {
                    $q->orWhereRaw('CAST(kode_gate AS UNSIGNED) = ?', [(int) $gateCode]);
                }
            })
            ->first();

            if (!$gate) return null;

            // Aturan operasional: 1 jam sebelum jadwal, satu penerbangan per gate,
            // hilang 5 menit setelah berangkat.
            $occupant = $this->gateOccupant($gate->flights);

            $arr = $gate->toArray();
            $arr['flights'] = FlightResource::collection($occupant)->resolve();
            return $arr;
        });

        if ($data === null) return response()->json(['message' => 'Not found'], 404);

        return response()->json(['data' => $data]);
    }

    public function checkin($counterNumber)
    {
        $key = "fids:api:checkin:{$counterNumber}:v{$this->flightCacheVersion()}";
        $data = Cache::remember($key, self::TTL_LIST, function () use ($counterNumber) {
            $counter = \App\Models\CheckinCounter::with(['airline', 'flights' => function($q) {
                $q->daily()
                  ->today()
                  ->where('status', 'Check-in Open')
                  ->orderBy('jam_jadwal', 'asc');
            }, ...self::nestedFlightRelations()])
            ->where(function ($q) use ($counterNumber) {
                $q->where('nomor_counter', $counterNumber);
                if (ctype_digit((string) $counterNumber)) {
                    $q->orWhereRaw('CAST(nomor_counter AS UNSIGNED) = ?', [(int) $counterNumber]);
                }
            })
            ->first();

            if (!$counter) return null;

            // Aturan: counter hanya menampilkan data bila ada penerbangan berstatus
            // "Check-in Open" (satu counter = satu penerbangan). Status counter untuk
            // tampilan ikut ditentukan oleh ada/tidaknya penerbangan open check-in.
            $occupant = $this->checkinOccupant($counter->flights);

            $arr = $counter->toArray();
            $arr['status_counter'] = $occupant->isNotEmpty() ? 'buka' : 'tutup';
            $arr['flights'] = FlightResource::collection($occupant)->resolve();

            if ($counter->airline && $counter->airline->logo) {
                $arr['airline']['logo'] = '/storage/' . $counter->airline->logo;
            }

            $arr['idle_image'] = $counter->idle_image ? '/storage/' . $counter->idle_image : null;
            return $arr;
        });

        if ($data === null) return response()->json(['message' => 'Not found'], 404);

        return response()->json(['data' => $data]);
    }

    public function baggage($beltNumber)
    {
        $key = "fids:api:baggage:{$beltNumber}:v{$this->flightCacheVersion()}";
        $data = Cache::remember($key, self::TTL_LIST, function () use ($beltNumber) {
            $settings = DisplaySetting::first();
            $statusMin = (int) ($settings->bagasi_durasi_status_menit ?? 30);
            $camEndMin = (int) ($settings->bagasi_kamera_selesai_menit ?? 20);
            // Belt tetap "aktif" selama teks status ATAU kamera masih relevan.
            $windowMin = max($statusMin, $camEndMin);

            $belt = \App\Models\BaggageClaim::with(['flights' => function($q) {
                $q->daily()
                  ->today()
                  ->whereIn('status', self::BAGGAGE_ARRIVED_STATUSES)
                  ->orderBy('jam_jadwal', 'asc');
            }, ...self::nestedFlightRelations()])
            ->where(function ($q) use ($beltNumber) {
                $q->where('nomor_belt', $beltNumber);
                if (ctype_digit((string) $beltNumber)) {
                    $q->orWhereRaw('CAST(nomor_belt AS UNSIGNED) = ?', [(int) $beltNumber]);
                }
            })
            ->first();

            if (!$belt) return null;

            $occupant = $this->baggageOccupant($belt->flights, $windowMin);
            $flightsArr = FlightResource::collection($occupant)->resolve();
            if ($occupant->isNotEmpty()) {
                // arrived_at dipakai frontend untuk menghitung menit sejak tiba
                // (kapan teks hilang & kapan kamera muncul/hilang).
                $flightsArr[0]['arrived_at'] = optional($this->flightArrivedAt($occupant->first()))->toIso8601String();
            }

            $arr = $belt->toArray();
            $arr['flights'] = $flightsArr;
            $arr['camera'] = $this->beltCamera($belt);
            return $arr;
        });

        if ($data === null) return response()->json(['message' => 'Not found'], 404);

        return response()->json(['data' => $data]);
    }

    /**
     * Dipanggil oleh layar publik setelah sebuah pengumuman selesai diputar.
     * Menaikkan broadcast_count dan menghapus pengumuman bila sudah mencapai batas.
     * Endpoint publik (tanpa auth/CSRF) agar layar kiosk yang tidak login tetap bisa melapor.
     */
    public function markAnnouncementPlayed(Announcement $announcement)
    {
        // Debounce lintas-layar: dengan N monitor yang semuanya melapor selesai memutar,
        // hitungan naik N kali per siklus (bug audit). UPDATE atomik dengan syarat
        // last_broadcast_at di luar jendela ini membuat laporan hampir-bersamaan dari
        // banyak layar hanya dihitung SEKALI — sekaligus menghilangkan race read-modify-write.
        $debounceSeconds = 30;

        $incremented = Announcement::where('id', $announcement->id)
            ->where(function ($q) use ($debounceSeconds) {
                $q->whereNull('last_broadcast_at')
                  ->orWhere('last_broadcast_at', '<=', now()->subSeconds($debounceSeconds));
            })
            ->update([
                'broadcast_count'   => DB::raw('broadcast_count + 1'),
                'last_broadcast_at' => now(),
            ]);

        $announcement->refresh();

        // Audit C-03: endpoint publik ini TIDAK menghapus data secara permanen.
        // Saat mencapai batas, pengumuman hanya dinonaktifkan (status_aktif=false) agar
        // tidak hilang dari antrian pending; pembersihan permanen dilakukan oleh proses
        // terotentikasi di Admin (PublicAnnouncementController@index).
        $reachedLimit = $announcement->broadcast_count >= $announcement->max_broadcasts;

        if ($incremented && $reachedLimit && $announcement->status_aktif) {
            $announcement->update(['status_aktif' => false]);
        }

        // Bust cache daftar pengumuman agar layar tidak memutar ulang yang sudah selesai.
        if ($incremented) {
            Cache::forget('fids:api:announcements');
        }

        return response()->json([
            'success'         => true,
            'finished'        => $reachedLimit,
            'counted'         => (bool) $incremented,
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
                  ->where('status', 'Check-in Open')
                  ->orderBy('jam_jadwal', 'asc');
            }, ...self::nestedFlightRelations()])->orderBy('nomor_counter', 'asc')->get();

            return $counters->map(function ($counter) {
                // Counter tampil "buka" + data hanya bila ada penerbangan open check-in.
                $occupant = $this->checkinOccupant($counter->flights);
                $arr = $counter->toArray();
                $arr['status_counter'] = $occupant->isNotEmpty() ? 'buka' : 'tutup';
                if ($counter->airline && $counter->airline->logo) {
                    $arr['airline']['logo'] = '/storage/' . $counter->airline->logo;
                }
                $arr['idle_image'] = $counter->idle_image ? '/storage/' . $counter->idle_image : null;
                $arr['flights'] = FlightResource::collection($occupant)->resolve();
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
                  ->orderBy('jam_jadwal', 'asc');
            }, ...self::nestedFlightRelations()])->orderBy('kode_gate', 'asc')->get();

            return $gates->map(function ($gate) {
                // Aturan operasional: 1 jam sebelum jadwal, satu penerbangan per gate,
                // hilang 5 menit setelah berangkat.
                $occupant = $this->gateOccupant($gate->flights);
                $arr = $gate->toArray();
                $arr['flights'] = FlightResource::collection($occupant)->resolve();
                return $arr;
            })->all();
        });

        return response()->json(['data' => $data]);
    }

    public function allBaggageClaims()
    {
        $data = Cache::remember('fids:api:baggage-claims', self::TTL_LIST, function () {
            $settings = DisplaySetting::first();
            $statusMin = (int) ($settings->bagasi_durasi_status_menit ?? 30);

            $claims = \App\Models\BaggageClaim::with(['flights' => function($q) {
                $q->daily()
                  ->today()
                  ->where('jenis_penerbangan', 'arrival')
                  ->whereIn('status', self::BAGGAGE_ARRIVED_STATUSES)
                  ->orderBy('jam_jadwal', 'asc');
            }, ...self::nestedFlightRelations()])->orderBy('nomor_belt', 'asc')->get();

            return $claims->map(function ($claim) use ($statusMin) {
                // Grid baggage: hanya teks status, jendela = durasi status.
                $occupant = $this->baggageOccupant($claim->flights, $statusMin);
                $flightsArr = FlightResource::collection($occupant)->resolve();
                if ($occupant->isNotEmpty()) {
                    $flightsArr[0]['arrived_at'] = optional($this->flightArrivedAt($occupant->first()))->toIso8601String();
                }
                $arr = $claim->toArray();
                $arr['flights'] = $flightsArr;
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
        // Cache HANYA bagian yang berasal dari DB (setting NTP + display). Timestamp
        // TIDAK boleh di-cache — dihitung fresh tiap request agar jam tetap akurat.
        $meta = Cache::remember('fids:api:time-meta', self::TTL_LIST, function () {
            $ntpSetting = NtpSetting::first();
            $displaySetting = DisplaySetting::first();

            $offsetMs = 0.0;
            $ntpStatus = 'unavailable';
            $ntpServer = null;

            if ($ntpSetting && $ntpSetting->last_sync_status === 'success' && $ntpSetting->last_offset_ms !== null) {
                $offsetMs = (float) $ntpSetting->last_offset_ms;
                $ntpStatus = 'synced';
                $ntpServer = $ntpSetting->last_server_used;
            }

            return [
                'timezone'      => $displaySetting?->timezone ?? config('app.timezone', 'UTC'),
                'bahasa'        => $displaySetting?->bahasa ?? 'id',
                'ntp_offset_ms' => $offsetMs,
                'ntp_status'    => $ntpStatus,
                'ntp_server'    => $ntpServer,
                'last_sync_at'  => $ntpSetting?->last_sync_at?->toIso8601String(),
            ];
        });

        // Waktu server saat ini (UTC), dikoreksi offset NTP — dihitung setiap request.
        $serverUtcNow = Carbon::now('UTC')->addMilliseconds((int) round($meta['ntp_offset_ms']));
        $displayTime = $serverUtcNow->copy()->setTimezone($meta['timezone']);

        return response()->json([
            'data' => [
                'utc_now'       => $serverUtcNow->toIso8601String(),
                'display_time'  => $displayTime->toIso8601String(),
                'timezone'      => $meta['timezone'],
                'bahasa'        => $meta['bahasa'],
                'ntp_offset_ms' => $meta['ntp_offset_ms'],
                'ntp_status'    => $meta['ntp_status'],
                'ntp_server'    => $meta['ntp_server'],
                'last_sync_at'  => $meta['last_sync_at'],
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
