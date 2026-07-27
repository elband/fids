<?php

namespace App\Http\Controllers\Admin\Taxi;

use App\Http\Controllers\Controller;
use App\Models\TaxiDirection;
use App\Models\TaxiFare;
use App\Models\TaxiRunningText;
use App\Models\TaxiScreen;
use App\Models\TaxiSetting;
use App\Models\TaxiVideo;
use App\Support\DisplayTimezone;
use App\Support\TaxiSignage;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $now = Carbon::now(DisplayTimezone::get());
        $setting = TaxiSetting::current();

        $topVideos = TaxiVideo::query()
            ->orderByDesc('play_count')
            ->limit(5)
            ->get(['id', 'judul', 'play_count', 'total_play_seconds', 'last_played_at']);

        $screens = TaxiScreen::query()->orderBy('kode')->get();

        return Inertia::render('Admin/Taxi/Dashboard', [
            'stats' => [
                'videos_total'      => TaxiVideo::count(),
                'videos_aktif'      => TaxiVideo::active()->count(),
                'videos_playlist'   => TaxiVideo::active()->forMoment($now)->count(),
                'playlist_sekarang' => TaxiVideo::playlistForHour((int) $now->format('G')),
                'tarif_total'       => TaxiFare::count(),
                'tarif_berlaku'     => TaxiFare::active()->effectiveOn($now)->count(),
                'petunjuk_aktif'    => TaxiDirection::active()->count(),
                'running_text_aktif' => TaxiRunningText::active()->scheduledFor($now)->count(),
                'penerbangan_tayang' => count(TaxiSignage::flights()),
                'layar_online'      => $screens->filter->isOnline()->count(),
                'layar_total'       => $screens->count(),
            ],
            'emergency' => [
                'active' => $setting->emergencyIsLive(),
                'judul'  => $setting->emergency_judul,
                'pesan'  => $setting->emergency_pesan,
                'sampai' => $setting->emergency_sampai?->format('Y-m-d\TH:i'),
            ],
            'topVideos' => $topVideos->map(fn (TaxiVideo $v) => [
                'id' => $v->id,
                'judul' => $v->judul,
                'play_count' => $v->play_count,
                'total_play_seconds' => $v->total_play_seconds,
                'last_played_at' => $v->last_played_at?->toIso8601String(),
            ]),
            'screens' => $screens->map(fn (TaxiScreen $s) => [
                'id' => $s->id,
                'kode' => $s->kode,
                'nama' => $s->nama,
                'lokasi' => $s->lokasi,
                'resolusi' => $s->resolusi,
                'ip_address' => $s->ip_address,
                'online' => $s->isOnline(),
                'last_seen_at' => $s->last_seen_at?->toIso8601String(),
            ]),
        ]);
    }
}
