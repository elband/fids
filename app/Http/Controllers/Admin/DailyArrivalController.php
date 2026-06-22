<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Flight;
use App\Models\Airline;
use App\Models\Airport;
use App\Models\Route as FlightRoute;
use App\Models\Gate;
use App\Models\CheckinCounter;
use App\Models\BaggageClaim;
use App\Models\FlightStatusLog;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use App\Http\Requests\Admin\FlightRequest;
use App\Services\FlightService;

class DailyArrivalController extends Controller
{
    protected $flightService;

    public function __construct(FlightService $flightService)
    {
        $this->flightService = $flightService;
    }

    public function index()
    {
        $dayNames = [
            0 => 'Minggu', 1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu',
            4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu',
        ];
        $today     = Carbon::now(\App\Support\DisplayTimezone::get());
        $todayName = $dayNames[$today->dayOfWeek];

        $flights = Flight::with(['airline', 'airportAsal', 'airportTujuan', 'gate', 'checkinCounters', 'baggageClaim'])
            ->arrival()
            ->daily()
            ->today()
            ->orderBy('jam_jadwal', 'asc')
            ->paginate(50);
            
        return Inertia::render('Admin/Arrivals/Index', [
            'flights' => $flights,
            'airlines' => Airline::all(),
            'airports' => Airport::all(),
            'gates' => Gate::all(),
            'checkinCounters' => CheckinCounter::orderByRaw('CAST(nomor_counter AS UNSIGNED), nomor_counter')->get(),
            'baggageClaims' => BaggageClaim::all(),
            'isDaily' => true,
            'routes' => FlightRoute::with(['airportAsal', 'airportTujuan'])->where('jenis_rute', 'arrival')->get(),
            'airplanes' => \App\Models\Airplane::with('airline')->get(),
            'server_timezone' => \App\Support\DisplayTimezone::get(),
            'utc_now' => Carbon::now('UTC')->toIso8601String(),
            'today_name' => $todayName,
            'today_date' => $today->toDateString(),
        ]);
    }

    public function store(FlightRequest $request)
    {
        $validated = $request->validated();
        $validated['jenis_penerbangan'] = 'arrival';
        $validated['is_master'] = false;

        $flight = $this->flightService->createFlight($validated);
        $this->flightService->syncCounters($flight, $request->checkin_counter_ids);

        return redirect()->back()->with('success', 'Jadwal kedatangan hari ini berhasil ditambahkan.');
    }

    public function update(FlightRequest $request, Flight $daily_arrival)
    {
        $arrival = $daily_arrival;
        $validated = $request->validated();
        $validated['jenis_penerbangan'] = 'arrival';

        $this->flightService->updateStatus($arrival, $validated['status'], $validated['catatan'] ?? null);
        $arrival->update($validated);
        $this->flightService->syncCounters($arrival, $request->checkin_counter_ids);

        return redirect()->back()->with('success', 'Jadwal kedatangan berhasil diupdate.');
    }

    public function destroy(Flight $daily_arrival)
    {
        $daily_arrival->delete();
        return redirect()->back()->with('success', 'Jadwal kedatangan berhasil dihapus.');
    }

    public function pullFromMaster()
    {
        \Illuminate\Support\Facades\Artisan::call('fids:generate-daily-flights');
        $output = \Illuminate\Support\Facades\Artisan::output();
        
        return redirect()->back()->with('success', 'Penarikan data selesai: ' . $output);
    }
}
