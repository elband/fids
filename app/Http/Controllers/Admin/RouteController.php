<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Route;
use App\Models\Airport;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RouteController extends Controller
{
    public function index()
    {
        $routes = Route::with(['airportAsal', 'airportTujuan'])->latest()->get();

        return Inertia::render('Admin/Routes/Index', [
            'routes' => $routes,
            'airports' => Airport::where('status_aktif', true)->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'airport_asal_id' => 'required|exists:airports,id',
            'airport_tujuan_id' => 'required|exists:airports,id|different:airport_asal_id',
            'tipe_layanan' => 'required|in:domestik,internasional',
            'jenis_rute' => 'required|in:departure,arrival',
            'status_aktif' => 'boolean',
        ]);

        Route::create($validated);
        return redirect()->back()->with('success', 'Rute berhasil ditambahkan.');
    }

    public function update(Request $request, Route $route)
    {
        $validated = $request->validate([
            'airport_asal_id' => 'required|exists:airports,id',
            'airport_tujuan_id' => 'required|exists:airports,id|different:airport_asal_id',
            'tipe_layanan' => 'required|in:domestik,internasional',
            'jenis_rute' => 'required|in:departure,arrival',
            'status_aktif' => 'boolean',
        ]);

        $route->update($validated);
        return redirect()->back()->with('success', 'Rute berhasil diupdate.');
    }

    public function destroy(Route $route)
    {
        $route->delete();
        return redirect()->back()->with('success', 'Rute berhasil dihapus.');
    }
}
