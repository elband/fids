<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\AirlineController;
use App\Http\Controllers\Admin\AirportController;
use App\Http\Controllers\Admin\RouteController as FlightRouteController;
use App\Http\Controllers\Admin\GateController;
use App\Http\Controllers\Admin\CheckinCounterController;
use App\Http\Controllers\Admin\BaggageClaimController;
use App\Http\Controllers\Admin\FlightController;
use App\Http\Controllers\Admin\WeatherInfoController;
use App\Http\Controllers\Admin\DisplaySettingController;
use App\Http\Controllers\Admin\AirplaneController;
use App\Http\Controllers\Admin\RemarkController;
use App\Http\Controllers\Admin\ReasonController;
use App\Http\Controllers\Admin\DepartureController;
use App\Http\Controllers\Admin\ArrivalController;
use App\Http\Controllers\Admin\DailyDepartureController;
use App\Http\Controllers\Admin\DailyArrivalController;
use App\Http\Controllers\Admin\AdvertisementController;
use App\Http\Controllers\Admin\PublicAnnouncementController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\NtpSettingController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\Taxi\CounterController as TaxiCounterController;
use App\Http\Controllers\Admin\Taxi\DashboardController as TaxiDashboardController;
use App\Http\Controllers\Admin\Taxi\DirectionController as TaxiDirectionController;
use App\Http\Controllers\Admin\Taxi\FareController as TaxiFareController;
use App\Http\Controllers\Admin\Taxi\RunningTextController as TaxiRunningTextController;
use App\Http\Controllers\Admin\Taxi\ScreenController as TaxiScreenController;
use App\Http\Controllers\Admin\Taxi\SettingController as TaxiSettingController;
use App\Http\Controllers\Admin\Taxi\VideoController as TaxiVideoController;
use App\Http\Controllers\DisplayController;
use App\Http\Controllers\WelcomeController;

Route::get('/', [WelcomeController::class, 'index'])->name('home');

// Public Display Routes - URL friendly untuk operator TV monitor
Route::prefix('public')->group(function () {
    Route::get('/flight/departure', [DisplayController::class, 'departure'])->name('public.flight.departure');
    Route::get('/flight/arrival',   [DisplayController::class, 'arrival'])->name('public.flight.arrival');

    Route::get('/gate/checkin',          [DisplayController::class, 'checkinCounter'])->name('public.gate.checkin');
    Route::get('/gate/boarding',         [DisplayController::class, 'boardingGate'])->name('public.gate.boarding');
    Route::get('/gate/baggageclaim',     [DisplayController::class, 'baggageClaim'])->name('public.gate.baggageclaim');

    Route::get('/gate/checkin/details',      [DisplayController::class, 'publicCheckinDetails'])->name('public.gate.checkin.details');
    Route::get('/gate/boarding/details',     [DisplayController::class, 'publicBoardingDetails'])->name('public.gate.boarding.details');
    Route::get('/gate/baggageclaim/details', [DisplayController::class, 'publicBaggageDetails'])->name('public.gate.baggageclaim.details');

    Route::get('/cctv/baggage',         [DisplayController::class, 'cctvBaggage'])->name('public.cctv.baggage');
    Route::get('/cctv/baggage/details', [DisplayController::class, 'publicCctvDetails'])->name('public.cctv.baggage.details');

    Route::get('/screen',        [DisplayController::class, 'publicScreen'])->name('public.screen');
    Route::get('/advertisement', [DisplayController::class, 'advertisementDisplay'])->name('public.advertisement');
    Route::get('/world-clock',   [DisplayController::class, 'worldClock'])->name('public.world-clock');

    Route::get('/taxi',          [DisplayController::class, 'taxiSignage'])->name('public.taxi');
});

Route::get('/mclock', [DisplayController::class, 'worldClock'])->name('mclock');

// Backward-compat: nama route lama display.* tetap aktif → redirect 301 ke URL baru.
// Saat user buka /display/* di browser, otomatis ter-redirect ke /public/*.
Route::get('/display/departure', fn () => redirect('/public/flight/departure', 301))
    ->name('display.departure');
Route::get('/display/arrival', fn () => redirect('/public/flight/arrival', 301))
    ->name('display.arrival');
Route::get('/display/checkin-counter', fn () => redirect('/public/gate/checkin', 301))
    ->name('display.checkin-counter');
Route::get('/display/boarding-gate', fn () => redirect('/public/gate/boarding', 301))
    ->name('display.boarding-gate');
Route::get('/display/baggage-claim', fn () => redirect('/public/gate/baggageclaim', 301))
    ->name('display.baggage-claim');
Route::get('/display/public-screen', fn () => redirect('/public/screen', 301))
    ->name('display.public-screen');
Route::get('/display/advertisement', fn () => redirect('/public/advertisement', 301))
    ->name('display.advertisement');
Route::get('/display/cctv-baggage', fn () => redirect('/public/cctv/baggage', 301))
    ->name('display.cctv-baggage');
Route::get('/display/cctv-baggage/{id}', fn ($id) => redirect("/public/cctv/baggage/details?id={$id}", 301))
    ->name('display.cctv-baggage.single');
Route::get('/display/checkin-counter/{nomor}', fn ($nomor) => redirect("/public/gate/checkin/details?id=gate-{$nomor}", 301));
Route::get('/display/boarding-gate/{kode}', fn ($kode) => redirect("/public/gate/boarding/details?id=gate-{$kode}", 301));
Route::get('/display/baggage-claim/{nomor}', fn ($nomor) => redirect("/public/gate/baggageclaim/details?id=gate-{$nomor}", 301));

Route::get('/api/pending-announcements', [DisplayController::class, 'pendingAnnouncementsApi'])->name('api.pending-announcements');

// RBAC (audit C-02): seluruh modul admin hanya untuk role operasional.
// Pengguna terautentikasi tanpa role (mis. sisa data lama) ditolak (deny-by-default).
Route::middleware(['auth', 'verified', 'role:Super Admin|Admin Operasional'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/export-flight-logs', [DashboardController::class, 'exportFlightLogs'])->name('dashboard.export-flight-logs');
    
    // UI admin sepenuhnya berbasis modal: form tambah/ubah tampil di halaman index,
    // tidak ada halaman create/edit/show terpisah. Verb-nya tidak didaftarkan agar
    // URL-nya dijawab 404/405 (bukan 500 karena method controller tidak ada).
    Route::resource('airlines', AirlineController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('airports', AirportController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('routes', FlightRouteController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('gates', GateController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('checkin-counters', CheckinCounterController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('baggage-claims', BaggageClaimController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('flights', FlightController::class)->only(['index', 'store', 'update', 'destroy']);
    // 'announcements' (Announcement) sengaja tidak punya route admin: record dibuat
    // otomatis oleh FlightService dan diputar command PlayAnnouncements. CRUD-nya
    // dulu ter-scaffold tapi komponen Pages/Admin/Announcements/Index.tsx tidak pernah ada,
    // sehingga /admin/announcements selalu gagal. Yang dikelola operator: public-announcements.
    Route::resource('weather-infos', WeatherInfoController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('cctv-cameras', \App\Http\Controllers\Admin\CctvCameraController::class)->only(['index', 'store', 'update', 'destroy']);

    // Report
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/departures', [ReportController::class, 'departures'])->name('departures');
        Route::get('/departures/pdf', [ReportController::class, 'exportDeparturesPdf'])->name('departures.pdf');
        Route::get('/arrivals', [ReportController::class, 'arrivals'])->name('arrivals');
        Route::get('/arrivals/pdf', [ReportController::class, 'exportArrivalsPdf'])->name('arrivals.pdf');
    });
    // Check-in Counter Custom Routes
    Route::post('checkin-counters/{checkin_counter}/remove-flight/{flight}', [CheckinCounterController::class, 'removeFlight'])->name('checkin-counters.remove-flight');
    
    // Gate Custom Routes
    Route::post('gates/{gate}/remove-flight/{flight}', [GateController::class, 'removeFlight'])->name('gates.remove-flight');
    
    // Baggage Claim Custom Routes
    Route::post('baggage-claims/{baggage_claim}/remove-flight/{flight}', [BaggageClaimController::class, 'removeFlight'])->name('baggage-claims.remove-flight');
    
    // New Master Data
    Route::resource('airplanes', AirplaneController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('remarks', RemarkController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('reasons', ReasonController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('departures', DepartureController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('arrivals', ArrivalController::class)->only(['index', 'store', 'update', 'destroy']);
    
    // Daily Operational Flights
    Route::post('daily-departures/pull', [DailyDepartureController::class, 'pullFromMaster'])->name('daily-departures.pull');
    Route::resource('daily-departures', DailyDepartureController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::post('daily-arrivals/pull', [DailyArrivalController::class, 'pullFromMaster'])->name('daily-arrivals.pull');
    Route::resource('daily-arrivals', DailyArrivalController::class)->only(['index', 'store', 'update', 'destroy']);
    
    Route::get('display-settings', [DisplaySettingController::class, 'index'])->name('display-settings.index');
    Route::post('display-settings', [DisplaySettingController::class, 'update'])->name('display-settings.update');
    Route::post('display-settings/force-reload', [DisplaySettingController::class, 'forceReload'])->name('display-settings.force-reload');
    Route::get('public-screen-settings', [DisplaySettingController::class, 'publicScreenSettings'])->name('public-screen-settings.index');
    Route::post('public-screen-settings', [DisplaySettingController::class, 'updatePublicScreenSettings'])->name('public-screen-settings.update');
    Route::resource('advertisements', AdvertisementController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::post('advertisements/update-order', [AdvertisementController::class, 'updateOrder'])->name('advertisements.update-order');
    Route::resource('public-announcements', PublicAnnouncementController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::post('public-announcements/{public_announcement}/broadcast', [PublicAnnouncementController::class, 'broadcast'])->name('public-announcements.broadcast');
    Route::post('public-announcements/{public_announcement}/increment-count', [PublicAnnouncementController::class, 'incrementCount'])->name('public-announcements.increment-count');

    // User Management — hanya Super Admin (audit C-02)
    Route::resource('users', UserController::class)->except(['create', 'edit', 'show'])->middleware('role:Super Admin');

    // NTP Settings
    Route::get('ntp-settings', [NtpSettingController::class, 'index'])->name('ntp-settings.index');
    Route::post('ntp-settings', [NtpSettingController::class, 'update'])->name('ntp-settings.update');
    Route::post('ntp-settings/sync', [NtpSettingController::class, 'sync'])->name('ntp-settings.sync');

    // World Clock Settings
    Route::get('world-clock-settings', [\App\Http\Controllers\Admin\WorldClockSettingController::class, 'index'])->name('world-clock-settings.index');
    Route::post('world-clock-settings', [\App\Http\Controllers\Admin\WorldClockSettingController::class, 'update'])->name('world-clock-settings.update');

    // Brochure PDF
    Route::get('brochure/download', [\App\Http\Controllers\Admin\BrochureController::class, 'download'])->name('brochure.download');
});

/*
 * Taxi Information & Digital Signage.
 *
 * Grup terpisah dari modul admin lain karena aksesnya berbasis permission
 * (Spatie), bukan role tetap — sehingga role seperti "Operator Informasi" bisa
 * mengelola tarif/running text tanpa diberi akses ke seluruh modul FIDS.
 * Super Admin lolos otomatis lewat Gate::before di AppServiceProvider.
 */
Route::middleware(['auth', 'verified', 'permission:taxi.view'])
    ->prefix('admin/taxi')->name('admin.taxi.')
    ->group(function () {
        Route::get('/', [TaxiDashboardController::class, 'index'])->name('dashboard');

        Route::middleware('permission:taxi.directions.manage')->group(function () {
            Route::get('directions', [TaxiDirectionController::class, 'index'])->name('directions.index');
            Route::post('directions', [TaxiDirectionController::class, 'store'])->name('directions.store');
            Route::put('directions/{direction}', [TaxiDirectionController::class, 'update'])->name('directions.update');
            Route::delete('directions/{direction}', [TaxiDirectionController::class, 'destroy'])->name('directions.destroy');
        });

        Route::middleware('permission:taxi.counters.manage')->group(function () {
            Route::get('counters', [TaxiCounterController::class, 'index'])->name('counters.index');
            Route::post('counters', [TaxiCounterController::class, 'store'])->name('counters.store');
            Route::put('counters/{counter}', [TaxiCounterController::class, 'update'])->name('counters.update');
            Route::delete('counters/{counter}', [TaxiCounterController::class, 'destroy'])->name('counters.destroy');
        });

        Route::middleware('permission:taxi.fares.manage')->group(function () {
            Route::get('fares', [TaxiFareController::class, 'index'])->name('fares.index');
            Route::post('fares', [TaxiFareController::class, 'store'])->name('fares.store');
            Route::put('fares/{fare}', [TaxiFareController::class, 'update'])->name('fares.update');
            Route::delete('fares/{fare}', [TaxiFareController::class, 'destroy'])->name('fares.destroy');
        });

        Route::middleware('permission:taxi.videos.manage')->group(function () {
            Route::get('videos', [TaxiVideoController::class, 'index'])->name('videos.index');
            Route::post('videos', [TaxiVideoController::class, 'store'])->name('videos.store');
            Route::put('videos/{video}', [TaxiVideoController::class, 'update'])->name('videos.update');
            Route::delete('videos/{video}', [TaxiVideoController::class, 'destroy'])->name('videos.destroy');
            Route::post('videos/{video}/reset-stats', [TaxiVideoController::class, 'resetStats'])->name('videos.reset-stats');
        });

        Route::middleware('permission:taxi.runningtext.manage')->group(function () {
            Route::get('running-texts', [TaxiRunningTextController::class, 'index'])->name('running-texts.index');
            Route::post('running-texts', [TaxiRunningTextController::class, 'store'])->name('running-texts.store');
            Route::put('running-texts/{running_text}', [TaxiRunningTextController::class, 'update'])->name('running-texts.update');
            Route::delete('running-texts/{running_text}', [TaxiRunningTextController::class, 'destroy'])->name('running-texts.destroy');
        });

        Route::middleware('permission:taxi.settings.manage')->group(function () {
            Route::get('settings', [TaxiSettingController::class, 'index'])->name('settings.index');
            Route::post('settings', [TaxiSettingController::class, 'update'])->name('settings.update');
        });

        Route::post('emergency', [TaxiSettingController::class, 'emergency'])
            ->middleware('permission:taxi.emergency.manage')->name('emergency');

        Route::middleware('permission:taxi.screens.view')->group(function () {
            Route::get('screens', [TaxiScreenController::class, 'index'])->name('screens.index');
            Route::put('screens/{screen}', [TaxiScreenController::class, 'update'])->name('screens.update');
            Route::delete('screens/{screen}', [TaxiScreenController::class, 'destroy'])->name('screens.destroy');
        });
    });

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
