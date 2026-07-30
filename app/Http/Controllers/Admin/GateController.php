<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Gate;
use App\Models\Flight;
use Inertia\Inertia;
use App\Services\FlightService;
use App\Support\DisplayTimezone;
use App\Support\FlightStatus;

class GateController extends Controller
{
    public function __construct(protected FlightService $flightService)
    {
    }

    public function index()
    {
        // Zona waktu tampilan FIDS (lihat catatan di CheckinCounterController::index).
        $today = DisplayTimezone::today()->toDateString();

        $gates = Gate::with(['flights' => function($query) use ($today) {
            // Daftar status dipusatkan di FlightStatus::GATE_BOARD supaya tidak lagi
            // menyimpang dari daftar yang dipakai API layar publik. Filter
            // jenis_penerbangan mencegah kedatangan ber-gate_id muncul di kartu gate.
            $query->daily()
                  ->whereDate('tanggal_penerbangan', $today)
                  ->where('jenis_penerbangan', 'departure')
                  ->whereIn('status', FlightStatus::GATE_BOARD)
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
            ->daily()
            ->whereDate('tanggal_penerbangan', $today)
            ->whereIn('status', FlightStatus::GATE_BOARD)
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
                // Status diubah lewat FlightService agar tercatat di FlightStatusLog dan
                // memicu pengumuman PA — sama seperti bila petugas mengubahnya dari modul
                // Keberangkatan. Sebelumnya update langsung membuat perubahan status dari
                // modul ini tidak muncul di Laporan/log Dashboard dan tanpa pengumuman.
                $flight->update(['gate_id' => $gate->id]);
                $this->flightService->updateStatus($flight, 'Gate Open');
            }
        }

        return redirect()->back()->with('success', 'Gate berhasil diupdate.');
    }

    public function removeFlight(Request $request, Gate $gate, Flight $flight)
    {
        if ($flight->gate_id == $gate->id) {
            $flight->update(['gate_id' => null]);
            $this->flightService->updateStatus($flight, 'Check-in Closed');

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
