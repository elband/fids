<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\BaggageClaim;
use App\Models\Flight;
use Inertia\Inertia;
use Carbon\Carbon;

class BaggageClaimController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        
        $claims = BaggageClaim::with(['flights' => function($query) use ($today) {
            $query->whereDate('tanggal_penerbangan', $today)
                  ->whereIn('status', ['Scheduled', 'Landed', 'Arrived', 'Baggage Claim', 'Delayed'])
                  ->orderBy('jam_jadwal')
                  ->with(['airline', 'airportAsal']);
        }])->orderBy('nomor_belt')->get();
        
        $todayArrivals = Flight::with(['airline', 'airportAsal'])
            ->where('jenis_penerbangan', 'arrival')
            ->whereDate('tanggal_penerbangan', $today)
            ->whereIn('status', ['Scheduled', 'Landed', 'Delayed'])
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
                $flight->update([
                    'baggage_claim_id' => $baggage_claim->id,
                    'status' => 'Baggage Claim'
                ]);
            }
        }

        return redirect()->back()->with('success', 'Baggage Claim Belt berhasil diupdate.');
    }

    public function removeFlight(Request $request, BaggageClaim $baggage_claim, Flight $flight)
    {
        if ($flight->baggage_claim_id == $baggage_claim->id) {
            $flight->update([
                'baggage_claim_id' => null,
                'status' => 'Arrived'
            ]);
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
