<?php

namespace App\Http\Controllers\Admin\Taxi;

use App\Http\Controllers\Controller;
use App\Models\TaxiScreen;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScreenController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Taxi/Screens', [
            'screens' => TaxiScreen::orderBy('kode')->get()->map(fn (TaxiScreen $s) => [
                ...$s->only(['id', 'kode', 'nama', 'lokasi', 'ip_address', 'resolusi']),
                'online' => $s->isOnline(),
                'last_seen_at' => $s->last_seen_at?->toIso8601String(),
            ]),
            'offlineAfterSeconds' => TaxiScreen::OFFLINE_AFTER_SECONDS,
        ]);
    }

    /** Beri nama/lokasi pada layar yang sudah mendaftar lewat heartbeat. */
    public function update(Request $request, TaxiScreen $screen)
    {
        $screen->update($request->validate([
            'nama' => 'nullable|string|max:150',
            'lokasi' => 'nullable|string|max:150',
        ]));

        return back()->with('success', 'Data layar diperbarui.');
    }

    public function destroy(TaxiScreen $screen)
    {
        $screen->delete();

        return back()->with('success', 'Layar dihapus dari monitoring.');
    }
}
