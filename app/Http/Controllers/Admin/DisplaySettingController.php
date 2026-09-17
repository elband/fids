<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DisplaySetting;
use App\Models\Advertisement;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use App\Models\MetarReport;
use App\Services\Metar\MetarService;

class DisplaySettingController extends Controller
{
    public function index()
    {
        $setting = DisplaySetting::first();
        $icao = strtoupper(trim((string) $setting?->metar_icao));

        return Inertia::render('Admin/DisplaySettings/Index', [
            'setting' => $setting,
            'metarReport' => $icao !== '' ? MetarReport::where('icao', $icao)->first() : null,
        ]);
    }

    /**
     * Tarik METAR sekarang juga (tanpa menunggu jadwal 30 menit) supaya petugas
     * bisa langsung memastikan alamat web & kode ICAO yang diisi benar.
     */
    public function fetchMetar(MetarService $service)
    {
        $report = $service->refresh();

        if ($report === null) {
            return back()->with('error', 'Penarikan METAR sedang dinonaktifkan. Aktifkan dan simpan pengaturan terlebih dahulu.');
        }

        if ($report->error_code !== null) {
            return back()->with('error', "METAR {$report->icao} gagal ditarik: {$report->error_message}");
        }

        return back()->with('success', "METAR {$report->icao} berhasil ditarik: {$report->raw_text}");
    }

    /**
     * Kirim sinyal "segarkan semua layar TV". Memperbarui force_reload_at;
     * tiap layar publik akan me-reload dirinya pada polling berikutnya.
     */
    public function forceReload()
    {
        $setting = DisplaySetting::first();
        if (! $setting) {
            return back()->with('error', 'Pengaturan layar belum ada.');
        }

        $setting->force_reload_at = now();
        $setting->save();

        // Buang cache API settings agar sinyal langsung terlihat layar.
        Cache::forget('fids:api:settings');

        return back()->with('success', 'Perintah segarkan dikirim. Semua layar TV akan memuat ulang dalam beberapa detik.');
    }

    public function publicScreenSettings()
    {
        $setting = DisplaySetting::first();
        $adCount = Advertisement::where('status', 'active')->count();
        return Inertia::render('Admin/PublicScreen/Settings', [
            'setting' => $setting,
            'adCount' => $adCount,
        ]);
    }

    public function updatePublicScreenSettings(Request $request)
    {
        $setting = DisplaySetting::first() ?? new DisplaySetting();

        $validated = $request->validate([
            'mode_default'       => 'required|string|in:single,2-column,3-column',
            'tema_warna'         => 'required|string',
            'warna_utama'        => 'nullable|string|max:32',
            'warna_aksen'        => 'nullable|string|max:32',
            'show_departures'    => 'boolean',
            'show_arrivals'      => 'boolean',
            'tampilkan_cuaca'    => 'boolean',
            'show_advertisement' => 'boolean',
            'background_header'  => 'nullable|image|max:5120',
            'remove_background'  => 'nullable|boolean',
        ]);

        // Catatan: nama_bandara, kecepatan_scroll, kecepatan_running_text, dan
        // teks_ticker TIDAK diatur di sini (dipindahkan ke halaman
        // "Pengaturan Layar FIDS" agar tidak dobel).
        $setting->mode_default       = $validated['mode_default'];
        $setting->tema_warna         = $validated['tema_warna'];
        $setting->warna_utama        = $validated['warna_utama'] ?? '#ffffff';
        $setting->warna_aksen        = $validated['warna_aksen'] ?? '#fbbf24';
        $setting->show_departures    = (bool) ($validated['show_departures']    ?? false);
        $setting->show_arrivals      = (bool) ($validated['show_arrivals']      ?? false);
        $setting->tampilkan_cuaca    = (bool) ($validated['tampilkan_cuaca']    ?? false);
        $setting->show_advertisement = (bool) ($validated['show_advertisement'] ?? false);

        if ($request->hasFile('background_header')) {
            if ($setting->background_header) {
                Storage::disk('public')->delete($setting->background_header);
            }
            $setting->background_header = $request->file('background_header')->store('settings', 'public');
        } elseif ($request->boolean('remove_background')) {
            if ($setting->background_header) {
                Storage::disk('public')->delete($setting->background_header);
            }
            $setting->background_header = null;
        }

        $setting->save();

        return redirect()->back()->with('success', 'Pengaturan TV Layar Publik berhasil disimpan.');
    }

    public function update(Request $request)
    {
        $setting = DisplaySetting::first() ?? new DisplaySetting();

        $validated = $request->validate([
            'nama_bandara'      => 'required|string',
            'logo_bandara'      => 'nullable|image|max:2048',
            'background_header' => 'nullable|image|max:5120',
            'kecepatan_scroll'  => 'required|integer|min:1|max:10',
            'kecepatan_running_text' => 'required|integer|min:1|max:10',
            'teks_ticker'       => 'nullable|string|max:500',
            'lokasi_google_maps' => 'nullable|string',
            'kode_bmkg'         => 'nullable|string',
            'runway_kode'       => 'nullable|string|max:16',
            // 0-359: 360 dan 0 menunjuk arah yang sama, jadi hanya satu yang diterima
            // supaya hitungan crosswind tidak punya dua representasi untuk satu arah.
            'runway_heading'    => 'nullable|integer|min:0|max:359',
            'metar_aktif'       => 'nullable|boolean',
            'metar_url'         => 'nullable|required_if:metar_aktif,true,1|url:http,https|max:255',
            'metar_icao'        => ['nullable', 'required_if:metar_aktif,true,1', 'regex:/^[A-Za-z]{4}$/'],
            'bahasa'            => 'required|string|in:id,en',
            'timezone'          => 'nullable|string|max:64',
            'bagasi_durasi_status_menit'  => 'nullable|integer|min:1|max:240',
            'board_hide_after_menit'      => 'nullable|integer|min:0|max:1440',
            'auto_reload_jam'             => 'nullable|integer|min:0|max:168',
            'mode_hemat'                  => 'nullable|boolean',
        ], [
            'metar_url.required_if'  => 'Alamat web METAR wajib diisi bila penarikan METAR aktif.',
            'metar_url.url'          => 'Alamat web METAR harus berupa URL http/https yang valid.',
            'metar_icao.required_if' => 'Kode ICAO wajib diisi bila penarikan METAR aktif.',
            'metar_icao.regex'       => 'Kode ICAO harus 4 huruf, mis. WALS.',
        ]);

        $setting->nama_bandara     = $validated['nama_bandara'];
        $setting->kecepatan_scroll = $validated['kecepatan_scroll'];
        $setting->kecepatan_running_text = $validated['kecepatan_running_text'];
        $setting->teks_ticker      = $validated['teks_ticker'] ?? null;
        $setting->lokasi_google_maps = $validated['lokasi_google_maps'] ?? null;
        $setting->kode_bmkg        = $validated['kode_bmkg'] ?? null;
        $setting->runway_kode      = $validated['runway_kode'] ?? null;
        $setting->runway_heading   = isset($validated['runway_heading']) ? (int) $validated['runway_heading'] : null;
        $setting->metar_aktif      = (bool) ($validated['metar_aktif'] ?? false);
        $setting->metar_url        = $validated['metar_url'] ?? null;
        $setting->metar_icao       = isset($validated['metar_icao']) ? strtoupper($validated['metar_icao']) : null;
        $setting->bahasa           = $validated['bahasa'];
        $setting->timezone         = $validated['timezone'] ?? null;

        if (isset($validated['bagasi_durasi_status_menit'])) {
            $setting->bagasi_durasi_status_menit = (int) $validated['bagasi_durasi_status_menit'];
        }
        if (array_key_exists('board_hide_after_menit', $validated) && $validated['board_hide_after_menit'] !== null) {
            $setting->board_hide_after_menit = (int) $validated['board_hide_after_menit'];
        }
        if (array_key_exists('auto_reload_jam', $validated) && $validated['auto_reload_jam'] !== null) {
            $setting->auto_reload_jam = (int) $validated['auto_reload_jam'];
        }
        $setting->mode_hemat = (bool) ($validated['mode_hemat'] ?? false);

        if ($request->hasFile('logo_bandara')) {
            if ($setting->logo_bandara) {
                Storage::disk('public')->delete($setting->logo_bandara);
            }
            $setting->logo_bandara = $request->file('logo_bandara')->store('settings', 'public');
        }

        if ($request->hasFile('background_header')) {
            if ($setting->background_header) {
                Storage::disk('public')->delete($setting->background_header);
            }
            $setting->background_header = $request->file('background_header')->store('settings', 'public');
        }

        $setting->save();
        Cache::forget(MetarService::CACHE_KEY);

        return redirect()->back()->with('success', 'Pengaturan tampilan berhasil disimpan.');
    }
}
