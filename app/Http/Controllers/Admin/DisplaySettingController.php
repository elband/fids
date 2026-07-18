<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DisplaySetting;
use App\Models\Advertisement;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class DisplaySettingController extends Controller
{
    public function index()
    {
        $setting = DisplaySetting::first();
        return Inertia::render('Admin/DisplaySettings/Index', [
            'setting' => $setting
        ]);
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
            'show_departures'    => 'boolean',
            'show_arrivals'      => 'boolean',
            'tampilkan_cuaca'    => 'boolean',
            'show_advertisement' => 'boolean',
            'background_header'  => 'nullable|image|max:5120',
            'nama_bandara'       => 'nullable|string|max:255',
            'kecepatan_scroll'   => 'nullable|integer|min:1|max:10',
            'teks_ticker'        => 'nullable|string|max:1000',
            'remove_background'  => 'nullable|boolean',
        ]);

        if (!empty($validated['nama_bandara'])) {
            $setting->nama_bandara = $validated['nama_bandara'];
        }
        $setting->mode_default       = $validated['mode_default'];
        $setting->tema_warna         = $validated['tema_warna'];
        $setting->show_departures    = (bool) ($validated['show_departures']    ?? false);
        $setting->show_arrivals      = (bool) ($validated['show_arrivals']      ?? false);
        $setting->tampilkan_cuaca    = (bool) ($validated['tampilkan_cuaca']    ?? false);
        $setting->show_advertisement = (bool) ($validated['show_advertisement'] ?? false);

        if (array_key_exists('kecepatan_scroll', $validated) && $validated['kecepatan_scroll'] !== null) {
            $setting->kecepatan_scroll = (int) $validated['kecepatan_scroll'];
        }
        if (array_key_exists('teks_ticker', $validated)) {
            $setting->teks_ticker = $validated['teks_ticker'];
        }

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
            'teks_ticker'       => 'nullable|string|max:500',
            'lokasi_google_maps' => 'nullable|string',
            'kode_bmkg'         => 'nullable|string',
            'bahasa'            => 'required|string|in:id,en',
            'timezone'          => 'nullable|string|max:64',
            'bagasi_durasi_status_menit'  => 'nullable|integer|min:1|max:240',
            'bagasi_kamera_mulai_menit'   => 'nullable|integer|min:0|max:240',
            'bagasi_kamera_selesai_menit' => 'nullable|integer|min:1|max:240',
        ]);

        $setting->nama_bandara     = $validated['nama_bandara'];
        $setting->kecepatan_scroll = $validated['kecepatan_scroll'];
        $setting->teks_ticker      = $validated['teks_ticker'] ?? null;
        $setting->lokasi_google_maps = $validated['lokasi_google_maps'] ?? null;
        $setting->kode_bmkg        = $validated['kode_bmkg'] ?? null;
        $setting->bahasa           = $validated['bahasa'];
        $setting->timezone         = $validated['timezone'] ?? null;

        if (isset($validated['bagasi_durasi_status_menit'])) {
            $setting->bagasi_durasi_status_menit = (int) $validated['bagasi_durasi_status_menit'];
        }
        if (isset($validated['bagasi_kamera_mulai_menit'])) {
            $setting->bagasi_kamera_mulai_menit = (int) $validated['bagasi_kamera_mulai_menit'];
        }
        if (isset($validated['bagasi_kamera_selesai_menit'])) {
            $setting->bagasi_kamera_selesai_menit = (int) $validated['bagasi_kamera_selesai_menit'];
        }

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

        return redirect()->back()->with('success', 'Pengaturan tampilan berhasil disimpan.');
    }
}
