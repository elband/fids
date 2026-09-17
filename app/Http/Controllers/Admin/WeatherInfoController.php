<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WeatherInfoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $weather = \App\Models\WeatherInfo::latest('updated_at')->first();
        return Inertia::render('Admin/Weather/Index', [
            'weather' => $weather
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'lokasi' => 'required|string',
            'suhu' => 'required|numeric',
            'kondisi_cuaca' => 'required|string',
            'kelembapan' => 'nullable|integer',
            'kecepatan_angin' => 'nullable|numeric',
            'arah_angin' => 'nullable|string|max:8',
            'arah_angin_derajat' => 'nullable|integer|min:0|max:360',
            'jarak_pandang' => 'nullable|integer|min:0|max:100000',
            'tutupan_awan' => 'nullable|integer|min:0|max:100',
        ]);

        $validated['updated_by'] = \Illuminate\Support\Facades\Auth::id();

        // Layar AMC mengutamakan teks BMKG (mis. "> 10 km"). Bila petugas mengisi
        // jarak pandang manual, teks BMKG lama harus dibuang agar tidak menutupi angkanya.
        if (array_key_exists('jarak_pandang', $validated)) {
            $validated['jarak_pandang_teks'] = null;
        }

        \App\Models\WeatherInfo::updateOrCreate(
            ['lokasi' => $validated['lokasi']],
            $validated
        );

        return redirect()->back()->with('success', 'Data cuaca berhasil diperbarui.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
