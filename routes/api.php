<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\DisplayApiController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('fids')->group(function () {
    Route::get('/departures', [DisplayApiController::class, 'departures']);
    Route::get('/arrivals', [DisplayApiController::class, 'arrivals']);
    Route::get('/gate/{gate}', [DisplayApiController::class, 'gate']);
    Route::get('/checkin/{counter}', [DisplayApiController::class, 'checkin']);
    Route::get('/baggage/{belt}', [DisplayApiController::class, 'baggage']);
    Route::get('/announcements', [DisplayApiController::class, 'announcements']);
    Route::get('/weather', [DisplayApiController::class, 'weather']);
    Route::get('/settings', [DisplayApiController::class, 'settings']);
    Route::get('/time', [DisplayApiController::class, 'time']);
    Route::get('/world-clock-settings', [DisplayApiController::class, 'worldClockSettings']);
    
    // Global Display APIs
    Route::get('/checkin-counters', [DisplayApiController::class, 'allCheckinCounters']);
    Route::get('/gates', [DisplayApiController::class, 'allGates']);
    Route::get('/baggage-claims', [DisplayApiController::class, 'allBaggageClaims']);
});
