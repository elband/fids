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
use App\Services\FlightService;

class FlightController extends Controller
{
    public function __construct(protected FlightService $flightService)
    {
    }

    public function index()
    {
        $flights = Flight::with(['airline', 'airportAsal', 'airportTujuan', 'gate', 'checkinCounter', 'checkinCounters', 'baggageClaim'])
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
        $validated = $request->validate($this->rules());

        $validated['created_by'] = Auth::id();

        $flight = Flight::create($validated);

        // Kolom checkin_counter_id di modul ini harus ikut mengisi pivot, karena
        // pivot-lah yang dibaca layar counter publik. Tanpa ini penerbangan yang
        // counter-nya diatur dari sini tidak pernah tampil di layar counter.
        $this->flightService->syncCounters($flight, $this->counterIds($validated));

        FlightStatusLog::create([
            'flight_id' => $flight->id,
            'status_baru' => $flight->status,
            'changed_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Jadwal penerbangan berhasil ditambahkan.');
    }

    /**
     * Daftar counter untuk syncCounters() dari pilihan tunggal modul ini.
     * Field nullable yang tidak dikirim tidak muncul di validated(), jadi jangan
     * mengakses kuncinya secara langsung.
     */
    private function counterIds(array $validated): array
    {
        $id = $validated['checkin_counter_id'] ?? null;

        return $id ? [$id] : [];
    }

    /**
     * Aturan validasi bersama store/update.
     *
     * `tanggal_penerbangan` nullable: master template menyimpannya null, sehingga
     * dulu setiap penyuntingan master dari modul ini selalu gagal validasi.
     */
    private function rules(): array
    {
        return [
            'tanggal_penerbangan' => 'nullable|date',
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
        ];
    }

    public function update(Request $request, Flight $flight)
    {
        $validated = $request->validate($this->rules());

        $validated['updated_by'] = Auth::id();

        $newStatus = $validated['status'];
        unset($validated['status']);

        $flight->update($validated);

        $this->flightService->syncCounters($flight, $this->counterIds($validated));

        // updateStatus() mencatat FlightStatusLog dan memicu pengumuman PA — sama
        // seperti modul Keberangkatan/Kedatangan. Sebelumnya modul ini menulis log
        // sendiri tanpa pengumuman, jadi perubahan status di sini tidak terdengar di PA.
        $this->flightService->updateStatus($flight, $newStatus, $validated['catatan'] ?? null);

        return redirect()->back()->with('success', 'Jadwal penerbangan berhasil diupdate.');
    }

    public function destroy(Flight $flight)
    {
        $flight->delete();
        return redirect()->back()->with('success', 'Jadwal penerbangan berhasil dihapus.');
    }
}
