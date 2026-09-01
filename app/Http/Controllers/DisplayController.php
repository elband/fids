<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Flight;
use App\Models\DisplaySetting;
use App\Models\Announcement;
use App\Models\Advertisement;
use App\Models\Gate;
use App\Models\CheckinCounter;
use App\Models\BaggageClaim;
use Inertia\Inertia;

class DisplayController extends Controller
{
    /**
     * Resolve identifier dari query param ?id=gate-1 → strip prefix & leading zero.
     */
    private function resolveId(Request $request, string $prefixPattern): string
    {
        $raw = trim((string) $request->query('id', ''));
        $stripped = preg_replace($prefixPattern, '', $raw);
        if ($stripped !== '' && ctype_digit($stripped)) {
            $stripped = (string) (int) $stripped;
        }
        return $stripped;
    }

    /**
     * Smart lookup: exact → numeric cast → suffix match.
     */
    private function smartLookup(string $model, string $column, string $id)
    {
        return $model::where($column, $id)
            ->when(ctype_digit($id), fn($q) => $q->orWhereRaw("CAST({$column} AS UNSIGNED) = ?", [(int)$id]))
            ->when(ctype_digit($id), fn($q) => $q->orWhere($column, 'LIKE', "%{$id}"))
            ->first();
    }

    // === PUBLIC ROUTE HANDLERS (dipanggil dari routes/web.php) ===

    public function publicCheckinDetails(Request $request)
    {
        $id = $this->resolveId($request, '/^(?:gate-|counter-|ct-)/i');
        if ($id === '') return $this->checkinCounter();
        $counter = $this->smartLookup(CheckinCounter::class, 'nomor_counter', $id);
        return $this->singleCheckinCounter($counter?->nomor_counter ?? $id);
    }

    public function publicBoardingDetails(Request $request)
    {
        $id = $this->resolveId($request, '/^(?:gate-|g-)/i');
        if ($id === '') return $this->boardingGate();
        $gate = $this->smartLookup(Gate::class, 'kode_gate', $id);
        return $this->singleBoardingGate($gate?->kode_gate ?? $id);
    }

    public function publicBaggageDetails(Request $request)
    {
        $id = $this->resolveId($request, '/^(?:gate-|belt-|b-)/i');
        if ($id === '') return $this->baggageClaim();
        $belt = $this->smartLookup(BaggageClaim::class, 'nomor_belt', $id);
        return $this->singleBaggageClaim($belt?->nomor_belt ?? $id);
    }

    public function publicCctvDetails(Request $request)
    {
        $id = $this->resolveId($request, '/^(?:cam-|cctv-)/i');
        if ($id === '') return $this->cctvBaggage();
        return $this->singleCctvBaggage($id);
    }

    public function publicScreen()
    {
        // Fresh install / tabel kosong: pakai model default agar halaman tetap tampil
        // alih-alih fatal "toArray() on null".
        $settings = DisplaySetting::first() ?? new DisplaySetting();

        $departures = Flight::with(['airline', 'airportTujuan'])
            ->where('jenis_penerbangan', 'departure')
            ->whereDate('tanggal_penerbangan', \App\Support\DisplayTimezone::now()->toDateString())
            ->orderBy('jam_jadwal')
            ->get();

        $arrivals = Flight::with(['airline', 'airportAsal'])
            ->where('jenis_penerbangan', 'arrival')
            ->whereDate('tanggal_penerbangan', \App\Support\DisplayTimezone::now()->toDateString())
            ->orderBy('jam_jadwal')
            ->get();

        // Fetch pending announcements — use each record's own interval_pemutaran
        $pendingAnnouncements = Announcement::where('status_aktif', true)
            ->where('broadcast_count', '<', \DB::raw('max_broadcasts'))
            ->where(function($q) {
                // COALESCE: interval NULL sebelumnya membuat DATE_SUB(...NULL) = NULL,
                // sehingga pengumuman tak pernah diputar ulang. Default 1 menit.
                $q->whereNull('last_broadcast_at')
                  ->orWhereRaw('last_broadcast_at <= DATE_SUB(NOW(), INTERVAL COALESCE(interval_pemutaran, 1) MINUTE)');
            })
            ->latest()
            ->get();

        // Map settings to include background URL
        $settingsData = $settings->toArray();
        $settingsData['background_header_url'] = $settings->background_header ? \Storage::url($settings->background_header) : null;
        $settingsData['screen_title'] = $settings->nama_bandara;
        $settingsData['layout_type'] = $settings->mode_default;
        $settingsData['theme_color'] = $settings->tema_warna;
        $settingsData['show_clock'] = true;
        $settingsData['show_weather'] = (bool) $settings->tampilkan_cuaca;
        $settingsData['show_advertisement'] = (bool) $settings->show_advertisement;
        $settingsData['show_ticker'] = !empty($settings->teks_ticker);
        $settingsData['ticker_text'] = $settings->teks_ticker ?? '';
        $settingsData['kecepatan_scroll'] = $settings->kecepatan_scroll ?? 1;

        $advertisements = Advertisement::where('status', 'active')->orderBy('order_index')->get();

        $timezone = \App\Support\DisplayTimezone::get();
        $settingsData['timezone'] = $timezone;

        return Inertia::render('Display/PublicScreenRealtime', [
            'settings' => $settingsData,
            'departures' => $departures,
            'arrivals' => $arrivals,
            'pendingAnnouncements' => $pendingAnnouncements,
            'weather' => \App\Models\WeatherInfo::latest()->first(),
            'advertisements' => $advertisements,
            'server_timezone' => $timezone,
            'utc_now' => \Carbon\Carbon::now('UTC')->toIso8601String(),
        ]);
    }

    public function departure()
    {
        $settings = DisplaySetting::first();
        $departures = Flight::with(['airline', 'airportTujuan', 'gate'])
            ->where('jenis_penerbangan', 'departure')
            ->whereDate('tanggal_penerbangan', \App\Support\DisplayTimezone::now()->toDateString())
            ->orderBy('jam_jadwal')
            ->get();

        return Inertia::render('Display/DepartureDisplay', [
            'settings' => $settings,
            'flights' => $departures
        ]);
    }

    public function arrival()
    {
        $settings = DisplaySetting::first();
        $arrivals = Flight::with(['airline', 'airportAsal', 'baggageClaim'])
            ->where('jenis_penerbangan', 'arrival')
            ->whereDate('tanggal_penerbangan', \App\Support\DisplayTimezone::now()->toDateString())
            ->orderBy('jam_jadwal')
            ->get();

        return Inertia::render('Display/ArrivalDisplay', [
            'settings' => $settings,
            'flights' => $arrivals
        ]);
    }

    public function checkinCounter()
    {
        return Inertia::render('Display/CheckinCounterDisplay');
    }

    public function boardingGate()
    {
        return Inertia::render('Display/BoardingGateDisplay');
    }

    public function baggageClaim()
    {
        return Inertia::render('Display/BaggageClaimDisplay');
    }

    public function singleCheckinCounter($nomor)
    {
        return Inertia::render('Display/SingleCheckinDisplay', [
            'identifier' => $nomor
        ]);
    }

    public function singleBoardingGate($kode)
    {
        return Inertia::render('Display/SingleGateDisplay', [
            'identifier' => $kode
        ]);
    }

    public function singleBaggageClaim($nomor)
    {
        return Inertia::render('Display/SingleBaggageDisplay', [
            'identifier' => $nomor
        ]);
    }

    public function advertisementDisplay()
    {
        $ads = Advertisement::where('status', 'active')
            ->orderBy('order_index')
            ->get(['id', 'title', 'media_path', 'media_type', 'duration']);

        return Inertia::render('Display/AdvertisementDisplay', [
            'ads' => $ads,
        ]);
    }

    public function cctvBaggage()
    {
        $cameras = \App\Models\CctvCamera::active()
            ->ofGroup('baggage')
            ->with(['baggageClaim:id,nomor_belt,terminal,area'])
            ->orderBy('urutan')
            ->orderBy('id')
            ->get();

        $cameras = $cameras->map(function ($cam) {
            $activeFlight = $this->cctvActiveFlight($cam);

            return [
                'id' => $cam->id,
                'nama' => $cam->nama,
                'lokasi' => $cam->lokasi,
                'jenis_stream' => $cam->jenis_stream,
                'url_stream' => $cam->url_stream,
                'baggage_claim_id' => $cam->baggage_claim_id,
                'baggage_claim' => $cam->baggageClaim ? [
                    'id' => $cam->baggageClaim->id,
                    'nomor_belt' => $cam->baggageClaim->nomor_belt,
                    'terminal' => $cam->baggageClaim->terminal,
                    'area' => $cam->baggageClaim->area,
                ] : null,
                'is_active' => (bool) $activeFlight,
                'active_flight' => $activeFlight ? $this->formatFlightSummary($activeFlight) : null,
            ];
        })->values();

        $advertisements = \App\Models\Advertisement::where('status', 'active')
            ->orderBy('order_index')
            ->get(['id', 'title', 'media_path', 'media_type', 'duration']);

        $settings = DisplaySetting::first();
        $timezone = \App\Support\DisplayTimezone::get();

        return Inertia::render('Display/CctvBaggageDisplay', [
            'cameras' => $cameras,
            'advertisements' => $advertisements,
            'settings' => $settings ? [
                'nama_bandara' => $settings->nama_bandara,
                'background_header' => $settings->background_header
                    ? \Storage::url($settings->background_header)
                    : null,
                'teks_ticker' => $settings->teks_ticker,
                'bahasa' => $settings->bahasa ?? 'id',
                'timezone' => $timezone,
            ] : ['nama_bandara' => null, 'background_header' => null, 'teks_ticker' => '', 'bahasa' => 'id', 'timezone' => $timezone],
            'server_timezone' => $timezone,
            'utc_now' => \Carbon\Carbon::now('UTC')->toIso8601String(),
        ]);
    }

    public function singleCctvBaggage($id)
    {
        $camera = \App\Models\CctvCamera::active()
            ->with('baggageClaim:id,nomor_belt,terminal,area')
            ->find($id);

        $activeFlight = $camera ? $this->cctvActiveFlight($camera) : null;

        $advertisements = \App\Models\Advertisement::where('status', 'active')
            ->orderBy('order_index')
            ->get(['id', 'title', 'media_path', 'media_type', 'duration']);

        $settings = DisplaySetting::first();
        $timezone = \App\Support\DisplayTimezone::get();

        return Inertia::render('Display/SingleCctvDisplay', [
            'camera' => $camera ? [
                'id' => $camera->id,
                'nama' => $camera->nama,
                'lokasi' => $camera->lokasi,
                'jenis_stream' => $camera->jenis_stream,
                'url_stream' => $camera->url_stream,
                'grup' => $camera->grup,
                'baggage_claim_id' => $camera->baggage_claim_id,
                'baggage_claim' => $camera->baggageClaim ? [
                    'id' => $camera->baggageClaim->id,
                    'nomor_belt' => $camera->baggageClaim->nomor_belt,
                    'terminal' => $camera->baggageClaim->terminal,
                    'area' => $camera->baggageClaim->area,
                ] : null,
                'is_active' => (bool) $activeFlight,
                'active_flight' => $activeFlight ? $this->formatFlightSummary($activeFlight) : null,
            ] : null,
            'advertisements' => $advertisements,
            'settings' => $settings ? [
                'nama_bandara' => $settings->nama_bandara,
                'background_header' => $settings->background_header
                    ? \Storage::url($settings->background_header)
                    : null,
                'bahasa' => $settings->bahasa ?? 'id',
                'timezone' => $timezone,
            ] : ['nama_bandara' => null, 'background_header' => null, 'bahasa' => 'id', 'timezone' => $timezone],
            'server_timezone' => $timezone,
            'utc_now' => \Carbon\Carbon::now('UTC')->toIso8601String(),
        ]);
    }

    /**
     * Penerbangan yang membuat sebuah kamera CCTV menyala, atau null.
     *
     * Pemicunya penerbangan arrival hari ini pada belt yang ditautkan ke kamera,
     * berstatus "sudah tiba". Bila ada lebih dari satu, yang paling relevan
     * dimenangkan: Baggage Claim > Arrived > Landed, lalu jam aktual terbaru.
     *
     * Dipakai bersama oleh layar CCTV multi-kamera dan layar kamera tunggal
     * supaya keduanya tidak bisa berbeda aturan.
     */
    private function cctvActiveFlight(\App\Models\CctvCamera $cam): ?Flight
    {
        if (! $cam->baggage_claim_id) {
            return null;
        }

        $flight = Flight::with(['airline:id,kode_maskapai,nama_maskapai,logo,warna_identitas', 'airportAsal:id,kota,kode_iata,nama_bandara'])
            ->where('jenis_penerbangan', 'arrival')
            ->whereDate('tanggal_penerbangan', \App\Support\DisplayTimezone::now()->toDateString())
            ->where('baggage_claim_id', $cam->baggage_claim_id)
            ->whereIn('status', \App\Support\FlightStatus::ARRIVED)
            // CASE, bukan FIELD(): FIELD() hanya ada di MySQL sehingga kueri ini
            // gagal total di SQLite — termasuk di test suite.
            ->orderByRaw("CASE status WHEN 'Baggage Claim' THEN 0 WHEN 'Arrived' THEN 1 WHEN 'Landed' THEN 2 ELSE 3 END")
            ->orderBy('jam_aktual', 'desc')
            ->orderBy('jam_estimasi', 'desc')
            ->first();

        if (! $flight) {
            return null;
        }

        return $this->withinCctvWindow($cam, $flight) ? $flight : null;
    }

    /**
     * Apakah kamera masih berada dalam jendela tampilnya sendiri?
     *
     * Jendela dihitung dalam menit sejak pesawat tiba. tampil_selesai_menit
     * NULL berarti tanpa batas akhir — kamera ikut umur status penerbangan,
     * yaitu perilaku sebelum jendela ini ada.
     */
    private function withinCctvWindow(\App\Models\CctvCamera $cam, Flight $flight): bool
    {
        $startMin = (int) ($cam->tampil_mulai_menit ?? 0);
        $endMin   = $cam->tampil_selesai_menit;

        // Jendela terbuka penuh: tidak perlu menghitung jam tiba sama sekali.
        if ($startMin <= 0 && $endMin === null) {
            return true;
        }

        // Tanpa ATA, patokannya updated_at — yaitu saat operator mengubah status
        // menjadi "sudah tiba", yang dalam praktik mendekati jam tiba sebenarnya.
        $arrivedAt = $this->cctvArrivedAt($flight);

        // Benar-benar tak ada patokan waktu: tampilkan saja. Kamera yang mati
        // diam-diam lebih sulit didiagnosis daripada yang menyala kelamaan.
        if (! $arrivedAt) {
            return true;
        }

        $elapsedMin = $arrivedAt->diffInMinutes(\App\Support\DisplayTimezone::now(), false);

        if ($elapsedMin < $startMin) {
            return false;
        }

        return $endMin === null || $elapsedMin < (int) $endMin;
    }

    /** Waktu tiba penerbangan: utamakan ATA (jam_aktual), fallback updated_at. */
    private function cctvArrivedAt(Flight $flight): ?\Carbon\Carbon
    {
        $tz = \App\Support\DisplayTimezone::get();

        if (! empty($flight->jam_aktual)) {
            $date = $flight->tanggal_penerbangan
                ? \Carbon\Carbon::parse($flight->tanggal_penerbangan)->toDateString()
                : \Carbon\Carbon::now($tz)->toDateString();

            return \Carbon\Carbon::parse("{$date} {$flight->jam_aktual}", $tz);
        }

        return $flight->updated_at ? $flight->updated_at->copy()->setTimezone($tz) : null;
    }

    private function formatFlightSummary(Flight $flight): array
    {
        return [
            'id' => $flight->id,
            'nomor_penerbangan' => $flight->nomor_penerbangan,
            'jam_jadwal' => $flight->jam_jadwal,
            'jam_estimasi' => $flight->jam_estimasi,
            'jam_aktual' => $flight->jam_aktual,
            'status' => $flight->status,
            'airline' => $flight->airline ? [
                'kode_maskapai' => $flight->airline->kode_maskapai,
                'nama_maskapai' => $flight->airline->nama_maskapai,
                'logo' => $flight->airline->logo
                    ? (str_starts_with($flight->airline->logo, 'http') ? $flight->airline->logo : \Storage::url($flight->airline->logo))
                    : null,
                'warna_identitas' => $flight->airline->warna_identitas,
            ] : null,
            'airport_asal' => $flight->airportAsal ? [
                'kode_iata' => $flight->airportAsal->kode_iata,
                'kota' => $flight->airportAsal->kota,
                'nama_bandara' => $flight->airportAsal->nama_bandara,
            ] : null,
        ];
    }

    public function publicAnnouncement()
    {
        return Inertia::render('Admin/PublicAnnouncement/Index');
    }

    public function worldClock()
    {
        return Inertia::render('Display/WorldClockDisplay');
    }

    /**
     * Layar "Taxi Information & Digital Signage".
     *
     * Props awal sengaja berisi payload lengkap supaya layar langsung tampil
     * penuh saat kios dinyalakan, lalu di-refresh lewat polling API.
     */
    public function taxiSignage(Request $request)
    {
        return Inertia::render('Display/TaxiSignage', [
            'initial' => \App\Support\TaxiSignage::payload(),
            // Kode layar (mis. /public/taxi?screen=terminal-a) untuk monitoring online/offline.
            'screenCode' => (string) $request->query('screen', ''),
        ]);
    }

    public function pendingAnnouncementsApi()
    {
        $pending = Announcement::where('status_aktif', true)
            ->where('broadcast_count', '<', \DB::raw('max_broadcasts'))
            ->where(function($q) {
                // COALESCE: interval NULL sebelumnya membuat DATE_SUB(...NULL) = NULL,
                // sehingga pengumuman tak pernah diputar ulang. Default 1 menit.
                $q->whereNull('last_broadcast_at')
                  ->orWhereRaw('last_broadcast_at <= DATE_SUB(NOW(), INTERVAL COALESCE(interval_pemutaran, 1) MINUTE)');
            })
            ->latest()
            ->get();

        return response()->json($pending);
    }
}
