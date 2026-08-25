<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Airline;
use App\Models\CheckinCounter;
use App\Models\Flight;
use App\Services\FlightService;
use App\Support\DisplayTimezone;
use App\Support\FlightStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CheckinCounterController extends Controller
{
    public function __construct(protected FlightService $flightService) {}

    public function index()
    {
        // Pakai zona waktu tampilan FIDS, bukan Carbon::today() (config app.timezone).
        // Operator dapat mengubah timezone dari Pengaturan Layar; dengan Carbon::today()
        // halaman ini menampilkan hari yang berbeda dari layar di sekitar tengah malam.
        $today = DisplayTimezone::today()->toDateString();

        $counters = CheckinCounter::with(['airline', 'flights' => function ($query) use ($today) {
            $query->with(['airline', 'airportTujuan'])
                ->daily()
                ->whereDate('tanggal_penerbangan', $today)
                ->whereIn('status', FlightStatus::CHECKIN_BOARD)
                ->orderBy('jam_jadwal');
        }])->orderBy('nomor_counter')->get();

        $airlines = Airline::where('status_aktif', true)->get();

        $todayDepartures = Flight::with(['airline', 'airportTujuan'])
            ->where('jenis_penerbangan', 'departure')
            ->daily()
            ->whereDate('tanggal_penerbangan', $today)
            ->whereIn('status', FlightStatus::CHECKIN_BOARD)
            ->orderBy('jam_jadwal')
            ->get();

        return Inertia::render('Admin/CheckinCounters/Index', [
            'counters' => $counters,
            'airlines' => $airlines,
            'flights' => $todayDepartures,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nomor_counter' => 'required|string|unique:checkin_counters',
            'area' => 'nullable|string',
            'terminal' => 'required|string',
            'status_counter' => 'required|in:buka,tutup,standby',
            'airline_id' => 'nullable|exists:airlines,id',
            'idle_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        if ($request->hasFile('idle_image')) {
            $validated['idle_image'] = $request->file('idle_image')->store('checkin-counters', 'public');
        }

        CheckinCounter::create($validated);

        return redirect()->back()->with('success', 'Check-in Counter berhasil ditambahkan.');
    }

    public function update(Request $request, CheckinCounter $checkin_counter)
    {
        $validated = $request->validate([
            'nomor_counter' => 'required|string|unique:checkin_counters,nomor_counter,'.$checkin_counter->id,
            'area' => 'nullable|string',
            'terminal' => 'required|string',
            'status_counter' => 'required|in:buka,tutup,standby',
            'airline_id' => 'nullable|exists:airlines,id',
            'idle_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'remove_idle_image' => 'nullable|boolean',
        ]);

        // Form selalu mengirim field idle_image, kosong bila operator tidak memilih
        // berkas baru. Nilai kosong itu masuk ke $validated sebagai null dan dulu
        // menimpa kolom, sehingga gambar hilang setiap counter disunting (mis. saat
        // hanya mengubah status atau assign penerbangan). Kolom hanya boleh disentuh
        // bila benar-benar ada unggahan baru atau permintaan hapus.
        unset($validated['idle_image'], $validated['remove_idle_image']);

        if ($request->boolean('remove_idle_image') || $request->hasFile('idle_image')) {
            if ($checkin_counter->idle_image) {
                Storage::disk('public')->delete($checkin_counter->idle_image);
            }

            $validated['idle_image'] = $request->hasFile('idle_image')
                ? $request->file('idle_image')->store('checkin-counters', 'public')
                : null;
        }

        $checkin_counter->update($validated);

        // Jika ada flight_id yang dikirim, kita update flight tersebut.
        // Lewat FlightService agar pivot flight_checkin_counter (yang dibaca layar
        // publik) ikut terisi dan perubahan status tercatat di FlightStatusLog.
        if ($request->has('flight_id') && $request->flight_id) {
            $flight = Flight::find($request->flight_id);
            if ($flight) {
                $this->flightService->assignCounter(
                    $flight,
                    $checkin_counter->id,
                    FlightStatus::CHECKIN_OPEN
                );
            }
        }

        return redirect()->back()->with('success', 'Check-in Counter berhasil diupdate.');
    }

    /**
     * Tombol Buka/Tutup di kartu counter.
     *
     * Yang dibalik adalah `dipaksa_tutup`, bukan `status_counter`: kolom status
     * default-nya 'tutup' di seluruh counter yang sudah ada, jadi menjadikannya
     * kendali layar akan memadamkan semua TV counter sekaligus. Lihat
     * DisplayApiController::checkinDisplayState().
     */
    public function toggleTutup(CheckinCounter $checkin_counter)
    {
        $checkin_counter->update(['dipaksa_tutup' => ! $checkin_counter->dipaksa_tutup]);

        return redirect()->back()->with(
            'success',
            $checkin_counter->dipaksa_tutup
                ? "Counter {$checkin_counter->nomor_counter} ditutup — layar berhenti menampilkan penerbangan."
                : "Counter {$checkin_counter->nomor_counter} dibuka — layar kembali mengikuti jadwal check-in."
        );
    }

    public function removeFlight(Request $request, CheckinCounter $checkin_counter, Flight $flight)
    {
        $detached = $this->flightService->detachCounter(
            $flight,
            $checkin_counter->id,
            'Check-in Closed'
        );

        if ($detached) {
            return redirect()->back()->with('success', 'Penerbangan berhasil dilepas dari counter.');
        }

        return redirect()->back()->with('error', 'Penerbangan tidak cocok dengan counter ini.');
    }

    public function destroy(CheckinCounter $checkin_counter)
    {
        if ($checkin_counter->idle_image) {
            Storage::disk('public')->delete($checkin_counter->idle_image);
        }
        $checkin_counter->delete();

        return redirect()->back()->with('success', 'Check-in Counter berhasil dihapus.');
    }
}
