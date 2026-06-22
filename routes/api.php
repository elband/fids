<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\DisplayApiController;
use App\Http\Controllers\Api\TransaksiApiController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Rate limiting (audit M-01): batasi per-IP untuk cegah DoS/scraping.
// Tiap monitor = 1 IP, polling ~6-12 req/mnt, jadi 120/mnt sangat longgar untuk read.
// Transaksi penerbangan (format mengikuti API referensi 103.210.122.2)
Route::prefix('transaksi')->middleware('throttle:60,1')->group(function () {
    Route::get('/keberangkatan', [TransaksiApiController::class, 'keberangkatan']);
    Route::get('/kedatangan', [TransaksiApiController::class, 'kedatangan']);
});

Route::prefix('fids')->middleware('throttle:120,1')->group(function () {
    Route::get('/departures', [DisplayApiController::class, 'departures']);
    Route::get('/arrivals', [DisplayApiController::class, 'arrivals']);
    Route::get('/gate/{gate}', [DisplayApiController::class, 'gate']);
    Route::get('/checkin/{counter}', [DisplayApiController::class, 'checkin']);
    Route::get('/baggage/{belt}', [DisplayApiController::class, 'baggage']);
    Route::get('/announcements', [DisplayApiController::class, 'announcements']);
    // Dilaporkan oleh layar publik tiap kali pengumuman selesai diputar (menaikkan broadcast_count).
    // Audit C-03: throttle ketat + endpoint TIDAK menghapus data (soft-deactivate di controller).
    // Disarankan tambahan: batasi ke VLAN/IP monitor di level Nginx/firewall.
    Route::post('/announcements/{announcement}/played', [DisplayApiController::class, 'markAnnouncementPlayed'])
        ->middleware('throttle:20,1');
    Route::get('/weather', [DisplayApiController::class, 'weather']);
    Route::get('/settings', [DisplayApiController::class, 'settings']);
    Route::get('/time', [DisplayApiController::class, 'time']);
    Route::get('/world-clock-settings', [DisplayApiController::class, 'worldClockSettings']);

    // Global Display APIs
    Route::get('/checkin-counters', [DisplayApiController::class, 'allCheckinCounters']);
    Route::get('/gates', [DisplayApiController::class, 'allGates']);
    Route::get('/baggage-claims', [DisplayApiController::class, 'allBaggageClaims']);
});
