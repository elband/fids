<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\BaggageClaim;
use App\Models\Flight;
use Inertia\Inertia;
use App\Services\FlightService;
use App\Support\DisplayTimezone;
use App\Support\FlightStatus;

class BaggageClaimController extends Controller
{
    public function __construct(protected FlightService $flightService)
    {
    }

    public function index()
    {
        // Zona waktu tampilan FIDS (lihat catatan di CheckinCounterController::index).
        $today = DisplayTimezone::today()->toDateString();

        $claims = BaggageClaim::with(['flights' => function($query) use ($today) {
            $query->daily()
                  ->whereDate('tanggal_penerbangan', $today)
                  ->where('jenis_penerbangan', 'arrival')
                  ->whereIn('status', FlightStatus::BAGGAGE_BOARD)
                  ->orderBy('jam_jadwal')
                  ->with(['airline', 'airportAsal']);
        }])->orderBy('nomor_belt')->get();

        $todayArrivals = Flight::with(['airline', 'airportAsal'])
            ->where('jenis_penerbangan', 'arrival')
            ->daily()
            ->whereDate('tanggal_penerbangan', $today)
            ->whereIn('status', FlightStatus::BAGGAGE_BOARD)
            ->orderBy('jam_jadwal')
            ->get();

        return Inertia::render('Admin/BaggageClaims/Index', [
            'claims' => $claims,
            'flights' => $todayArrivals
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nomor_belt' => 'required|string|unique:baggage_claims',
            'area' => 'nullable|string',
            'terminal' => 'required|string',
            'status_belt' => 'required|in:aktif,tidak_aktif,maintenance',
        ]);

        BaggageClaim::create($validated);
        return redirect()->back()->with('success', 'Baggage Claim Belt berhasil ditambahkan.');
    }

    public function update(Request $request, BaggageClaim $baggage_claim)
    {
        $validated = $request->validate([
            'nomor_belt' => 'required|string|unique:baggage_claims,nomor_belt,' . $baggage_claim->id,
            'area' => 'nullable|string',
            'terminal' => 'required|string',
            'status_belt' => 'required|in:aktif,tidak_aktif,maintenance',
        ]);

        $baggage_claim->update($validated);

        if ($request->has('flight_id') && $request->flight_id) {
            $flight = Flight::find($request->flight_id);
            if ($flight) {
                // Status lewat FlightService agar tercatat di FlightStatusLog + memicu
                // pengumuman, konsisten dengan modul Kedatangan.
                $flight->update(['baggage_claim_id' => $baggage_claim->id]);
                $this->flightService->updateStatus($flight, 'Baggage Claim');
            }
        }

        return redirect()->back()->with('success', 'Baggage Claim Belt berhasil diupdate.');
    }

    public function removeFlight(Request $request, BaggageClaim $baggage_claim, Flight $flight)
    {
        if ($flight->baggage_claim_id == $baggage_claim->id) {
            $flight->update(['baggage_claim_id' => null]);
            $this->flightService->updateStatus($flight, 'Arrived');

            return redirect()->back()->with('success', 'Penerbangan berhasil dilepas dari belt.');
        }
        return redirect()->back()->with('error', 'Penerbangan tidak cocok dengan belt ini.');
    }

    public function destroy(BaggageClaim $baggage_claim)
    {
        $baggage_claim->delete();
        return redirect()->back()->with('success', 'Baggage Claim Belt berhasil dihapus.');
    }
}
