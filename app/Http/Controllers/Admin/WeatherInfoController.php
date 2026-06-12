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
        $weather = \App\Models\WeatherInfo::latest()->first();
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
        ]);

        $validated['updated_by'] = \Illuminate\Support\Facades\Auth::id();

        \App\Models\WeatherInfo::updateOrCreate(
            ['lokasi' => $validated['lokasi']],
            $validated
        );

        return redirect()->back()->with('success', 'Data cuaca berhasil diperbarui.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
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
