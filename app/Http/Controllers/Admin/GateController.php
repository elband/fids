<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Gate;
use App\Models\Flight;
use Inertia\Inertia;
use Carbon\Carbon;

class GateController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        
        $gates = Gate::with(['flights' => function($query) use ($today) {
            $query->whereDate('tanggal_penerbangan', $today)
                  ->whereIn('status', ['Scheduled', 'Boarding', 'Gate Open', 'Final Call', 'Delayed'])
                  ->orderBy('jam_jadwal')
                  ->with(['airline', 'airportTujuan']);
        }])->orderBy('kode_gate')->get();

        // Tambah field tujuan dari relasi airportTujuan
        $gates->each(function ($gate) {
            $gate->flights->each(function ($flight) {
                $flight->tujuan = $flight->airportTujuan?->kota ?? '-';
            });
        });

        $todayDepartures = Flight::with(['airline', 'airportTujuan'])
            ->where('jenis_penerbangan', 'departure')
            ->whereDate('tanggal_penerbangan', $today)
            ->whereIn('status', ['Scheduled', 'Check-in Open', 'Check-in Closed', 'Gate Open', 'Delayed'])
            ->orderBy('jam_jadwal')
            ->get()
            ->map(function ($flight) {
                $flight->tujuan = $flight->airportTujuan?->kota ?? '-';
                return $flight;
            });

        return Inertia::render('Admin/Gates/Index', [
            'gates' => $gates,
            'flights' => $todayDepartures
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_gate' => 'required|string|unique:gates',
            'nama_gate' => 'required|string',
            'terminal' => 'required|string',
            'status_gate' => 'required|in:aktif,tidak_aktif,maintenance',
            'petunjuk_arah' => 'nullable|string|max:255',
        ]);

        Gate::create($validated);
        return redirect()->back()->with('success', 'Gate berhasil ditambahkan.');
    }

    public function update(Request $request, Gate $gate)
    {
        $validated = $request->validate([
            'kode_gate' => 'required|string|unique:gates,kode_gate,' . $gate->id,
            'nama_gate' => 'required|string',
            'terminal' => 'required|string',
            'status_gate' => 'required|in:aktif,tidak_aktif,maintenance',
            'petunjuk_arah' => 'nullable|string|max:255',
        ]);

        $gate->update($validated);

        if ($request->has('flight_id') && $request->flight_id) {
            $flight = Flight::find($request->flight_id);
            if ($flight) {
                $flight->update([
                    'gate_id' => $gate->id,
                    'status' => 'Gate Open'
                ]);
            }
        }

        return redirect()->back()->with('success', 'Gate berhasil diupdate.');
    }

    public function removeFlight(Request $request, Gate $gate, Flight $flight)
    {
        if ($flight->gate_id == $gate->id) {
            $flight->update([
                'gate_id' => null,
                'status' => 'Check-in Closed'
            ]);
            return redirect()->back()->with('success', 'Penerbangan berhasil dilepas dari gate.');
        }
        return redirect()->back()->with('error', 'Penerbangan tidak cocok dengan gate ini.');
    }

    public function destroy(Gate $gate)
    {
        $gate->delete();
        return redirect()->back()->with('success', 'Gate berhasil dihapus.');
    }
}
