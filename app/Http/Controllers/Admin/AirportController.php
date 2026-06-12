<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Airport;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AirportController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Airports/Index', [
            'airports' => Airport::latest()->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_iata' => 'required|string|size:3|unique:airports,kode_iata',
            'nama_bandara' => 'required|string|max:255',
            'kota' => 'required|string|max:255',
            'negara' => 'required|string|max:255',
            'status_aktif' => 'boolean',
        ]);

        Airport::create($validated);

        return redirect()->back()->with('success', 'Bandara berhasil ditambahkan.');
    }

    public function update(Request $request, Airport $airport)
    {
        $validated = $request->validate([
            'kode_iata' => 'required|string|size:3|unique:airports,kode_iata,' . $airport->id,
            'nama_bandara' => 'required|string|max:255',
            'kota' => 'required|string|max:255',
            'negara' => 'required|string|max:255',
            'status_aktif' => 'boolean',
        ]);

        $airport->update($validated);

        return redirect()->back()->with('success', 'Bandara berhasil diperbarui.');
    }

    public function destroy(Airport $airport)
    {
        // Check if used in routes
        if ($airport->departureRoutes()->exists() || $airport->arrivalRoutes()->exists()) {
            return redirect()->back()->with('error', 'Bandara tidak dapat dihapus karena masih digunakan dalam Rute.');
        }

        $airport->delete();

        return redirect()->back()->with('success', 'Bandara berhasil dihapus.');
    }
}
