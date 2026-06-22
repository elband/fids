<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Flight;
use App\Models\Airline;
use App\Models\Airport;
use App\Models\Gate;
use App\Models\CheckinCounter;
use App\Models\BaggageClaim;
use App\Models\FlightStatusLog;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class FlightController extends Controller
{
    public function index()
    {
        $flights = Flight::with(['airline', 'airportAsal', 'airportTujuan', 'gate', 'checkinCounter', 'baggageClaim'])
            ->latest('tanggal_penerbangan')
            ->latest('jam_jadwal')
            ->paginate(50);
            
        return Inertia::render('Admin/Flights/Index', [
            'flights' => $flights,
            'airlines' => Airline::all(),
            'airports' => Airport::all(),
            'gates' => Gate::all(),
            'checkinCounters' => CheckinCounter::orderByRaw('CAST(nomor_counter AS UNSIGNED), nomor_counter')->get(),
            'baggageClaims' => BaggageClaim::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tanggal_penerbangan' => 'required|date',
            'nomor_penerbangan' => 'required|string',
            'airline_id' => 'required|exists:airlines,id',
            'airport_asal_id' => 'required|exists:airports,id',
            'airport_tujuan_id' => 'required|exists:airports,id',
            'jam_jadwal' => 'required',
            'jam_estimasi' => 'nullable',
            'jam_aktual' => 'nullable',
            'jenis_penerbangan' => 'required|in:departure,arrival',
            'tipe_layanan' => 'required|in:domestik,internasional',
            'gate_id' => 'nullable|exists:gates,id',
            'checkin_counter_id' => 'nullable|exists:checkin_counters,id',
            'baggage_claim_id' => 'nullable|exists:baggage_claims,id',
            'status' => 'required|string',
            'catatan' => 'nullable|string',
        ]);

        $validated['created_by'] = Auth::id();

        $flight = Flight::create($validated);
        
        FlightStatusLog::create([
            'flight_id' => $flight->id,
            'status_baru' => $flight->status,
            'changed_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Jadwal penerbangan berhasil ditambahkan.');
    }

    public function update(Request $request, Flight $flight)
    {
        $validated = $request->validate([
            'tanggal_penerbangan' => 'required|date',
            'nomor_penerbangan' => 'required|string',
            'airline_id' => 'required|exists:airlines,id',
            'airport_asal_id' => 'required|exists:airports,id',
            'airport_tujuan_id' => 'required|exists:airports,id',
            'jam_jadwal' => 'required',
            'jam_estimasi' => 'nullable',
            'jam_aktual' => 'nullable',
            'jenis_penerbangan' => 'required|in:departure,arrival',
            'tipe_layanan' => 'required|in:domestik,internasional',
            'gate_id' => 'nullable|exists:gates,id',
            'checkin_counter_id' => 'nullable|exists:checkin_counters,id',
            'baggage_claim_id' => 'nullable|exists:baggage_claims,id',
            'status' => 'required|string',
            'catatan' => 'nullable|string',
        ]);

        $validated['updated_by'] = Auth::id();
        
        $oldStatus = $flight->status;

        $flight->update($validated);
        
        if ($oldStatus !== $flight->status) {
            FlightStatusLog::create([
                'flight_id' => $flight->id,
                'status_lama' => $oldStatus,
                'status_baru' => $flight->status,
                'changed_by' => Auth::id(),
            ]);
        }

        return redirect()->back()->with('success', 'Jadwal penerbangan berhasil diupdate.');
    }

    public function destroy(Flight $flight)
    {
        $flight->delete();
        return redirect()->back()->with('success', 'Jadwal penerbangan berhasil dihapus.');
    }
}
