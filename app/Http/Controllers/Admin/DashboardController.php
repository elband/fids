<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Flight;
use App\Models\FlightStatusLog;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function exportFlightLogs()
    {
        $flightLogs = FlightStatusLog::with(['flight.airline', 'flight.airportAsal', 'flight.airportTujuan', 'changedBy'])
            ->whereDate('changed_at', \App\Support\DisplayTimezone::today()->toDateString())
            ->latest('changed_at')
            ->get();

        $pdf = Pdf::loadView('admin.flight-logs-pdf', [
            'flightLogs' => $flightLogs,
            'generatedAt' => Carbon::now(),
        ])->setPaper('a4', 'landscape');

        return $pdf->download('flight-logs-'.Carbon::now()->format('YmdHis').'.pdf');
    }

    public function index()
    {
        // Zona waktu tampilan FIDS agar batas "hari ini" sama dengan scope Flight::today().
        $today = \App\Support\DisplayTimezone::today()->toDateString();

        $flightsToday = Flight::daily()->today();
        
        $totalFlights = (clone $flightsToday)->count();
        $totalDepartures = (clone $flightsToday)->departure()->count();
        $totalArrivals = (clone $flightsToday)->arrival()->count();
        
        $scheduled = (clone $flightsToday)->where('status', 'Scheduled')->count();
        $delayed = (clone $flightsToday)->where('status', 'Delayed')->count();
        $cancelled = (clone $flightsToday)->where('status', 'Cancelled')->count();
        $boarding = (clone $flightsToday)->where('status', 'Boarding')->count();
        $arrived = (clone $flightsToday)->whereIn('status', ['Arrived', 'Landed'])->count();
        $departed = (clone $flightsToday)->where('status', 'Departed')->count();
        $gatesAssigned = Flight::daily()->today()->whereNotNull('gate_id')->distinct('gate_id')->count('gate_id');
        // Hitung dari pivot flight_checkin_counter — sumber kebenaran penugasan counter.
        // Dulu KPI ini membaca kolom warisan flights.checkin_counter_id yang tidak diisi
        // oleh modul Keberangkatan, sehingga nilainya nyaris selalu 0.
        $checkinCountersAssigned = \App\Models\CheckinCounter::whereHas(
            'flights',
            fn ($q) => $q->daily()->today()
        )->count();
        $activeAirlines = Flight::daily()->today()->distinct('airline_id')->count('airline_id');

        // Hourly Data untuk Chart (Optimized: Single query instead of 48)
        $hourlyStats = Flight::selectRaw('HOUR(jam_jadwal) as hour, jenis_penerbangan, count(*) as total')
            ->daily()
            ->today()
            ->groupBy('hour', 'jenis_penerbangan')
            ->get();

        $hourlyData = [];
        for ($i = 0; $i < 24; $i++) {
            $hourString = str_pad($i, 2, '0', STR_PAD_LEFT) . ':00';
            $hourlyData[] = [
                'name' => $hourString,
                'keberangkatan' => (int)($hourlyStats->where('hour', $i)->where('jenis_penerbangan', 'departure')->first()->total ?? 0),
                'kedatangan' => (int)($hourlyStats->where('hour', $i)->where('jenis_penerbangan', 'arrival')->first()->total ?? 0),
            ];
        }

        // Recent Flights (5 upcoming flights)
        $recentFlights = Flight::with(['airline', 'airportTujuan', 'airportAsal'])
            ->whereDate('tanggal_penerbangan', '>=', $today)
            ->whereIn('status', ['Scheduled', 'Boarding', 'Delayed'])
            ->orderBy('tanggal_penerbangan')
            ->orderBy('jam_jadwal')
            ->take(5)
            ->get();

        // Sumber zona waktu: pengaturan layar FIDS (fallback ke config app)
        $timezone = \App\Support\DisplayTimezone::get();

        $serverTime = Carbon::now($timezone);
        $utcTime = $serverTime->copy()->setTimezone('UTC');
        
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_flights' => $totalFlights,
                'total_departures' => $totalDepartures,
                'total_arrivals' => $totalArrivals,
                'scheduled' => $scheduled,
                'delayed' => $delayed,
                'cancelled' => $cancelled,
                'boarding' => $boarding,
                'arrived' => $arrived,
                'departed' => $departed,
                'gates_assigned' => $gatesAssigned,
                'checkin_counters' => $checkinCountersAssigned,
                'active_airlines' => $activeAirlines,
            ],
            'hourly_data' => $hourlyData,
            'recent_flights' => $recentFlights,
            'weather' => \App\Models\WeatherInfo::latest()->first(),
            'server_time' => $serverTime->toIso8601String(),
            'server_timezone' => $timezone,
            'utc_time' => $utcTime->toIso8601String(),
        ]);
    }
}
