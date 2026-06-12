<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WorldClockSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WorldClockSettingController extends Controller
{
    public function index()
    {
        $setting = WorldClockSetting::first();

        if (!$setting) {
            $setting = WorldClockSetting::create([
                'show_utc' => true,
                'show_wib' => true,
                'show_wita' => true,
                'show_wit' => true,
                'format_waktu' => '24h',
                'show_seconds' => true,
                'show_date' => true,
                'tema_warna' => '#0f172a',
                'accent_color' => '#3b82f6',
                'show_nama_bandara' => true,
                'show_analog_clock' => false,
                'show_ntp_status' => true,
                'use_background_image' => false,
            ]);
        }

        return Inertia::render('Admin/WorldClock/Index', [
            'setting' => $setting,
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'format_waktu' => 'required|string|in:12h,24h',
            'tema_warna' => 'required|string|max:20',
            'accent_color' => 'required|string|max:20',
            'judul_layar' => 'nullable|string|max:255',
        ]);

        $setting = WorldClockSetting::first() ?? new WorldClockSetting();

        // Boolean fields — use $request->boolean() to handle false correctly
        $setting->show_utc = $request->boolean('show_utc');
        $setting->show_wib = $request->boolean('show_wib');
        $setting->show_wita = $request->boolean('show_wita');
        $setting->show_wit = $request->boolean('show_wit');
        $setting->show_seconds = $request->boolean('show_seconds');
        $setting->show_date = $request->boolean('show_date');
        $setting->show_nama_bandara = $request->boolean('show_nama_bandara');
        $setting->show_analog_clock = $request->boolean('show_analog_clock');
        $setting->show_ntp_status = $request->boolean('show_ntp_status');
        $setting->use_background_image = $request->boolean('use_background_image');

        // Non-boolean fields
        $setting->format_waktu = $request->input('format_waktu');
        $setting->tema_warna = $request->input('tema_warna');
        $setting->accent_color = $request->input('accent_color');
        $setting->judul_layar = $request->input('judul_layar') ?: null;

        $setting->save();

        return redirect()->back()->with('success', 'Pengaturan World Clock berhasil disimpan.');
    }
}
