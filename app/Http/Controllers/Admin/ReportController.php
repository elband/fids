<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Flight;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function departures(Request $request)
    {
        return $this->renderReport($request, 'departure');
    }

    public function arrivals(Request $request)
    {
        return $this->renderReport($request, 'arrival');
    }

    public function exportDeparturesPdf(Request $request)
    {
        return $this->exportPdf($request, 'departure');
    }

    public function exportArrivalsPdf(Request $request)
    {
        return $this->exportPdf($request, 'arrival');
    }

    private function renderReport(Request $request, string $jenis)
    {
        $tz = \App\Support\DisplayTimezone::get();
        [$start, $end] = $this->resolveRange($request, $tz);

        $flights = Flight::with(['airline', 'airportAsal', 'airportTujuan', 'gate', 'baggageClaim'])
            ->where('jenis_penerbangan', $jenis)
            ->where('is_master', false)
            ->whereBetween('tanggal_penerbangan', [$start->toDateString(), $end->toDateString()])
            ->orderBy('tanggal_penerbangan')
            ->orderBy('jam_jadwal')
            ->get();

        $statusBuckets = $flights->groupBy('status')->map->count();

        return Inertia::render('Admin/Reports/Index', [
            'mode' => $jenis,
            'flights' => $flights,
            'filters' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
            ],
            'summary' => [
                'total' => $flights->count(),
                'on_time' => (int) ($statusBuckets['Departed'] ?? 0) + (int) ($statusBuckets['Landed'] ?? 0) + (int) ($statusBuckets['Arrived'] ?? 0),
                'delayed' => (int) ($statusBuckets['Delayed'] ?? 0),
                'cancelled' => (int) ($statusBuckets['Cancelled'] ?? 0),
            ],
            'server_timezone' => $tz,
        ]);
    }

    private function exportPdf(Request $request, string $jenis)
    {
        $tz = \App\Support\DisplayTimezone::get();
        [$start, $end] = $this->resolveRange($request, $tz);

        $flights = Flight::with(['airline', 'airportAsal', 'airportTujuan', 'gate', 'baggageClaim'])
            ->where('jenis_penerbangan', $jenis)
            ->where('is_master', false)
            ->whereBetween('tanggal_penerbangan', [$start->toDateString(), $end->toDateString()])
            ->orderBy('tanggal_penerbangan')
            ->orderBy('jam_jadwal')
            ->get();

        $analytics = $this->buildAnalytics($flights, $jenis);

        $pdf = Pdf::loadView('admin.reports.flights-pdf', [
            'flights' => $flights,
            'mode' => $jenis,
            'start' => $start,
            'end' => $end,
            'generatedAt' => Carbon::now($tz),
            'analytics' => $analytics,
            'tz' => $tz,
        ])->setPaper('a4', 'landscape');

        $name = ($jenis === 'departure' ? 'keberangkatan' : 'kedatangan')
            . '-' . $start->toDateString() . '_to_' . $end->toDateString() . '.pdf';

        return $pdf->download($name);
    }

    private function buildAnalytics($flights, string $jenis): array
    {
        $total = $flights->count();

        // Status buckets
        $statusBuckets = $flights->groupBy('status')->map->count()->sortDesc();

        $onTimeKeys = $jenis === 'departure'
            ? ['Departed']
            : ['Arrived', 'Landed'];

        $onTime = collect($onTimeKeys)->sum(fn ($k) => (int) ($statusBuckets[$k] ?? 0));
        $delayed = (int) ($statusBuckets['Delayed'] ?? 0);
        $cancelled = (int) ($statusBuckets['Cancelled'] ?? 0);
        $scheduled = (int) ($statusBuckets['Scheduled'] ?? 0);
        $boarding = (int) ($statusBuckets['Boarding'] ?? 0)
            + (int) ($statusBuckets['Final Call'] ?? 0)
            + (int) ($statusBuckets['Gate Open'] ?? 0)
            + (int) ($statusBuckets['Check-in Open'] ?? 0);

        $completed = $onTime + $cancelled; // sudah punya hasil akhir
        $performanceRate = $total > 0 ? round(($onTime / max(1, $completed)) * 100, 1) : 0.0;
        $cancelRate = $total > 0 ? round(($cancelled / $total) * 100, 1) : 0.0;
        $delayRate = $total > 0 ? round(($delayed / $total) * 100, 1) : 0.0;

        // Hourly distribution (00..23)
        $hourly = array_fill(0, 24, 0);
        foreach ($flights as $f) {
            if (!$f->jam_jadwal) continue;
            $h = (int) substr((string) $f->jam_jadwal, 0, 2);
            if ($h >= 0 && $h <= 23) {
                $hourly[$h]++;
            }
        }
        $peakHour = collect($hourly)->keys()->sortByDesc(fn ($k) => $hourly[$k])->first();
        $peakCount = $hourly[$peakHour] ?? 0;

        // Avg delay (minutes) — only for flights with both jam_jadwal & jam_aktual
        $delayDurations = [];
        foreach ($flights as $f) {
            if (!$f->jam_jadwal || !$f->jam_aktual) continue;
            try {
                $sched = Carbon::parse($f->tanggal_penerbangan->toDateString() . ' ' . $f->jam_jadwal);
                $actual = Carbon::parse($f->tanggal_penerbangan->toDateString() . ' ' . $f->jam_aktual);
                $diff = $actual->diffInMinutes($sched, false);
                if ($diff > 0) $delayDurations[] = $diff;
            } catch (\Throwable $e) { /* skip */ }
        }
        $avgDelay = !empty($delayDurations) ? (int) round(array_sum($delayDurations) / count($delayDurations)) : 0;
        $maxDelay = !empty($delayDurations) ? max($delayDurations) : 0;

        // Top airlines
        $topAirlines = $flights
            ->groupBy(fn ($f) => optional($f->airline)->nama_maskapai ?? '—')
            ->map->count()
            ->sortDesc()
            ->take(5);

        // Top destinations / origins (depending on jenis)
        $topPlaces = $flights
            ->groupBy(function ($f) use ($jenis) {
                $ap = $jenis === 'departure' ? $f->airportTujuan : $f->airportAsal;
                if (!$ap) return '—';
                return ($ap->kode_iata ?: '???') . ' · ' . ($ap->kota ?? $ap->nama_bandara ?? '');
            })
            ->map->count()
            ->sortDesc()
            ->take(5);

        // Insights
        $insights = [];

        if ($total === 0) {
            $insights[] = 'Tidak ada penerbangan dalam rentang ini.';
        } else {
            $insights[] = 'Total ' . $total . ' penerbangan ' . ($jenis === 'departure' ? 'keberangkatan' : 'kedatangan') . ' tercatat.';

            if ($completed > 0) {
                if ($performanceRate >= 90) {
                    $insights[] = 'Kinerja operasi sangat baik dengan tingkat ketepatan ' . $performanceRate . '%.';
                } elseif ($performanceRate >= 75) {
                    $insights[] = 'Kinerja operasi cukup baik (' . $performanceRate . '%). Masih ada ruang untuk peningkatan.';
                } else {
                    $insights[] = 'Kinerja operasi perlu perhatian: tingkat ketepatan hanya ' . $performanceRate . '%.';
                }
            }

            if ($cancelled > 0) {
                $insights[] = $cancelled . ' penerbangan dibatalkan (' . $cancelRate . '% dari total).';
            }
            if ($delayed > 0) {
                $insights[] = $delayed . ' penerbangan terlambat (' . $delayRate . '% dari total)' . ($avgDelay > 0 ? ', rata-rata ' . $avgDelay . ' menit' : '') . '.';
            }
            if ($peakCount > 0) {
                $insights[] = 'Jam tersibuk: ' . str_pad($peakHour, 2, '0', STR_PAD_LEFT) . ':00 dengan ' . $peakCount . ' penerbangan.';
            }
            if ($topAirlines->isNotEmpty()) {
                $first = $topAirlines->keys()->first();
                $insights[] = 'Maskapai terbanyak: ' . $first . ' (' . $topAirlines->first() . ' penerbangan).';
            }
            if ($scheduled > 0) {
                $insights[] = $scheduled . ' penerbangan masih berstatus Scheduled (belum berangkat/tiba).';
            }
        }

        return [
            'total' => $total,
            'on_time' => $onTime,
            'delayed' => $delayed,
            'cancelled' => $cancelled,
            'scheduled' => $scheduled,
            'boarding' => $boarding,
            'performance_rate' => $performanceRate,
            'cancel_rate' => $cancelRate,
            'delay_rate' => $delayRate,
            'avg_delay' => $avgDelay,
            'max_delay' => $maxDelay,
            'status_buckets' => $statusBuckets,
            'hourly' => $hourly,
            'peak_hour' => $peakHour,
            'peak_count' => $peakCount,
            'top_airlines' => $topAirlines,
            'top_places' => $topPlaces,
            'insights' => $insights,
        ];
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function resolveRange(Request $request, string $tz): array
    {
        $today = Carbon::today($tz);
        $start = $request->filled('start') ? Carbon::parse($request->input('start'), $tz)->startOfDay() : $today->copy();
        $end = $request->filled('end') ? Carbon::parse($request->input('end'), $tz)->startOfDay() : $today->copy();

        if ($end->lt($start)) {
            $end = $start->copy();
        }

        return [$start, $end];
    }
}
