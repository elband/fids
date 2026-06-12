<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Airplane;
use App\Models\Airline;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AirplaneController extends Controller
{
    public function index()
    {
        $airplanes = Airplane::with('airline')->latest()->get();
        $airlines = Airline::where('status_aktif', true)->get();
        return Inertia::render('Admin/Airplanes/Index', [
            'airplanes' => $airplanes,
            'airlines' => $airlines
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'airline_id' => 'required|exists:airlines,id',
            'nomor_registrasi' => 'required|string|unique:airplanes',
            'tipe_pesawat' => 'required|string',
            'kapasitas' => 'nullable|integer',
            'status_aktif' => 'boolean',
        ]);

        Airplane::create($validated);
        return redirect()->back()->with('success', 'Pesawat berhasil ditambahkan.');
    }

    public function update(Request $request, Airplane $airplane)
    {
        $validated = $request->validate([
            'airline_id' => 'required|exists:airlines,id',
            'nomor_registrasi' => 'required|string|unique:airplanes,nomor_registrasi,' . $airplane->id,
            'tipe_pesawat' => 'required|string',
            'kapasitas' => 'nullable|integer',
            'status_aktif' => 'boolean',
        ]);

        $airplane->update($validated);
        return redirect()->back()->with('success', 'Pesawat berhasil diupdate.');
    }

    public function destroy(Airplane $airplane)
    {
        $airplane->delete();
        return redirect()->back()->with('success', 'Pesawat berhasil dihapus.');
    }
}
