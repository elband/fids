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

class DailyDepartureController extends Controller
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
            ->departure()
            ->daily()
            ->today()
            ->orderBy('jam_jadwal', 'asc')
            ->paginate(50);
            
        return Inertia::render('Admin/Departures/Index', [
            'flights' => $flights,
            'airlines' => Airline::all(),
            'airports' => Airport::all(),
            'gates' => Gate::all(),
            'checkinCounters' => CheckinCounter::all(),
            'baggageClaims' => BaggageClaim::all(),
            'isDaily' => true,
            'routes' => FlightRoute::with(['airportAsal', 'airportTujuan'])->where('jenis_rute', 'departure')->get(),
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
        $validated['jenis_penerbangan'] = 'departure';
        $validated['is_master'] = false;

        $flight = $this->flightService->createFlight($validated);
        $this->flightService->syncCounters($flight, $request->checkin_counter_ids);

        return redirect()->back()->with('success', 'Jadwal keberangkatan hari ini berhasil ditambahkan.');
    }

    public function update(FlightRequest $request, Flight $daily_departure)
    {
        $departure = $daily_departure;
        $validated = $request->validated();
        $validated['jenis_penerbangan'] = 'departure';

        $this->flightService->updateStatus($departure, $validated['status'], $validated['catatan'] ?? null);
        $departure->update($validated);
        $this->flightService->syncCounters($departure, $request->checkin_counter_ids);

        return redirect()->back()->with('success', 'Jadwal keberangkatan berhasil diupdate.');
    }

    public function destroy(Flight $daily_departure)
    {
        $daily_departure->delete();
        return redirect()->back()->with('success', 'Jadwal keberangkatan berhasil dihapus.');
    }

    public function pullFromMaster()
    {
        \Illuminate\Support\Facades\Artisan::call('fids:generate-daily-flights');
        $output = \Illuminate\Support\Facades\Artisan::output();
        
        // Extract count from output if possible, or just show generic success
        return redirect()->back()->with('success', 'Penarikan data selesai: ' . $output);
    }
}
