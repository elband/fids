<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TaxiScreen;
use App\Models\TaxiVideo;
use App\Support\TaxiSignage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Endpoint polling untuk layar Taxi Information & Digital Signage.
 * Read-only kecuali heartbeat dan statistik pemutaran video.
 */
class TaxiSignageApiController extends Controller
{
    /** Seluruh konten layar dalam satu permintaan (hemat koneksi di perangkat display). */
    public function index(): JsonResponse
    {
        return response()->json(['data' => TaxiSignage::payload()]);
    }

    /**
     * Dilaporkan tiap layar secara berkala agar operator bisa melihat status
     * online/offline di dashboard monitoring.
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kode' => 'required|string|max:100',
            'resolusi' => 'nullable|string|max:20',
        ]);

        $screen = TaxiScreen::updateOrCreate(
            ['kode' => $data['kode']],
            [
                'resolusi' => $data['resolusi'] ?? null,
                'ip_address' => $request->ip(),
                'last_seen_at' => now(),
            ],
        );

        return response()->json(['data' => ['id' => $screen->id, 'ok' => true]]);
    }

    /**
     * Statistik pemutaran video. Dipanggil layar setiap satu video selesai
     * (atau dilewati karena gagal diputar, dengan durasi seadanya).
     */
    public function videoPlayed(Request $request, TaxiVideo $video): JsonResponse
    {
        $data = $request->validate([
            'seconds' => 'nullable|integer|min:0|max:36000',
        ]);

        $video->forceFill([
            'play_count' => $video->play_count + 1,
            'total_play_seconds' => $video->total_play_seconds + (int) ($data['seconds'] ?? 0),
            'last_played_at' => now(),
        ])->saveQuietly(); // hindari bust cache konten tiap video selesai

        return response()->json(['data' => ['ok' => true]]);
    }
}
