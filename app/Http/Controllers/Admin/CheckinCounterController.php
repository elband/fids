<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CheckinCounter;
use App\Models\Airline;
use App\Models\Flight;
use Inertia\Inertia;
use Carbon\Carbon;

class CheckinCounterController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        
        $counters = CheckinCounter::with(['airline', 'flights' => function($query) use ($today) {
            $query->with(['airline', 'airportTujuan'])
                  ->whereDate('tanggal_penerbangan', $today)
                  ->whereIn('status', ['Scheduled', 'Check-in Open', 'Check-in Closed', 'Delayed'])
                  ->orderBy('jam_jadwal');
        }])->orderBy('nomor_counter')->get();

        $airlines = Airline::where('status_aktif', true)->get();
        
        $todayDepartures = Flight::with(['airline', 'airportTujuan'])
            ->where('jenis_penerbangan', 'departure')
            ->whereDate('tanggal_penerbangan', $today)
            ->whereIn('status', ['Scheduled', 'Check-in Open', 'Delayed'])
            ->orderBy('jam_jadwal')
            ->get();

        return Inertia::render('Admin/CheckinCounters/Index', [
            'counters' => $counters,
            'airlines' => $airlines,
            'flights' => $todayDepartures
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
        ]);

        CheckinCounter::create($validated);
        return redirect()->back()->with('success', 'Check-in Counter berhasil ditambahkan.');
    }

    public function update(Request $request, CheckinCounter $checkin_counter)
    {
        $validated = $request->validate([
            'nomor_counter' => 'required|string|unique:checkin_counters,nomor_counter,' . $checkin_counter->id,
            'area' => 'nullable|string',
            'terminal' => 'required|string',
            'status_counter' => 'required|in:buka,tutup,standby',
            'airline_id' => 'nullable|exists:airlines,id',
        ]);

        $checkin_counter->update($validated);

        // Jika ada flight_id yang dikirim, kita update flight tersebut
        if ($request->has('flight_id') && $request->flight_id) {
            $flight = Flight::find($request->flight_id);
            if ($flight) {
                $flight->update([
                    'checkin_counter_id' => $checkin_counter->id,
                    'status' => 'Check-in Open' // Auto update status
                ]);
            }
        }

        return redirect()->back()->with('success', 'Check-in Counter berhasil diupdate.');
    }
    
    public function removeFlight(Request $request, CheckinCounter $checkin_counter, Flight $flight)
    {
        if ($flight->checkin_counter_id == $checkin_counter->id) {
            $flight->update([
                'checkin_counter_id' => null,
                'status' => 'Check-in Closed'
            ]);
            return redirect()->back()->with('success', 'Penerbangan berhasil dilepas dari counter.');
        }
        return redirect()->back()->with('error', 'Penerbangan tidak cocok dengan counter ini.');
    }

    public function destroy(CheckinCounter $checkin_counter)
    {
        $checkin_counter->delete();
        return redirect()->back()->with('success', 'Check-in Counter berhasil dihapus.');
    }
}
