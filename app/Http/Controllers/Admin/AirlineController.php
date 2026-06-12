<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAirlineRequest;
use App\Http\Requests\Admin\UpdateAirlineRequest;
use App\Models\Airline;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class AirlineController extends Controller
{
    public function index()
    {
        $airlines = Airline::latest()->get();
        return Inertia::render('Admin/Airlines/Index', ['airlines' => $airlines]);
    }

    public function store(StoreAirlineRequest $request)
    {
        $validated = $request->validated();

        if ($request->hasFile('logo')) {
            $validated['logo'] = $request->file('logo')->store('airlines', 'public');
        }

        Airline::create($validated);
        return redirect()->back()->with('success', 'Maskapai berhasil ditambahkan.');
    }

    public function update(UpdateAirlineRequest $request, Airline $airline)
    {
        $validated = $request->validated();

        if ($request->hasFile('logo')) {
            if ($airline->logo) {
                Storage::disk('public')->delete($airline->logo);
            }
            $validated['logo'] = $request->file('logo')->store('airlines', 'public');
        }

        $airline->update($validated);
        return redirect()->back()->with('success', 'Maskapai berhasil diupdate.');
    }

    public function destroy(Airline $airline)
    {
        if ($airline->logo) {
            Storage::disk('public')->delete($airline->logo);
        }
        $airline->delete();
        return redirect()->back()->with('success', 'Maskapai berhasil dihapus.');
    }
}
