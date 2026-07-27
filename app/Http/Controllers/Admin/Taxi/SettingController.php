<?php

namespace App\Http\Controllers\Admin\Taxi;

use App\Http\Controllers\Controller;
use App\Models\TaxiSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(): Response
    {
        $s = TaxiSetting::current();

        return Inertia::render('Admin/Taxi/Settings', [
            'setting' => [
                ...$s->only([
                    'id', 'judul_layar', 'warna_aksen', 'tema_warna',
                    'video_interval_detik', 'flight_refresh_detik', 'running_text_speed',
                    'scroll_detik_per_layar', 'bahasa', 'bahasa_switch_detik',
                    'tampilkan_penerbangan', 'tampilkan_video', 'tampilkan_tarif', 'mode_hemat',
                ]),
                'logo_url' => $s->logo_path ? '/storage/' . $s->logo_path : null,
                'background_url' => $s->background_path ? '/storage/' . $s->background_path : null,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'judul_layar' => 'required|string|max:150',
            'warna_aksen' => 'required|string|max:20',
            'tema_warna' => 'required|in:slate,midnight,teal,plum',
            // 0 = biarkan video diputar sampai habis sebelum lanjut.
            'video_interval_detik' => 'required|integer|min:0|max:3600',
            'flight_refresh_detik' => 'required|integer|min:5|max:600',
            'running_text_speed' => 'required|integer|min:10|max:600',
            'scroll_detik_per_layar' => 'required|integer|min:5|max:600',
            'bahasa' => 'required|in:id,en,auto',
            'bahasa_switch_detik' => 'required|integer|min:5|max:600',
            'tampilkan_penerbangan' => 'required|boolean',
            'tampilkan_video' => 'required|boolean',
            'tampilkan_tarif' => 'required|boolean',
            'mode_hemat' => 'required|boolean',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,webp,svg|max:4096',
            'background' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:10240',
            'hapus_logo' => 'nullable|boolean',
            'hapus_background' => 'nullable|boolean',
        ]);

        $setting = TaxiSetting::current();

        foreach (['logo' => 'logo_path', 'background' => 'background_path'] as $field => $column) {
            if ($request->boolean("hapus_{$field}") && $setting->{$column}) {
                Storage::disk('public')->delete($setting->{$column});
                $data[$column] = null;
            }
            if ($request->hasFile($field)) {
                if ($setting->{$column}) {
                    Storage::disk('public')->delete($setting->{$column});
                }
                $data[$column] = $request->file($field)->store('taxi/branding', 'public');
            }
        }

        unset($data['logo'], $data['background'], $data['hapus_logo'], $data['hapus_background']);

        $setting->update($data);

        return back()->with('success', 'Pengaturan display taksi disimpan.');
    }

    /** Emergency override: menggantikan seluruh konten layar sementara waktu. */
    public function emergency(Request $request)
    {
        $data = $request->validate([
            'emergency_active' => 'required|boolean',
            'emergency_judul' => 'nullable|string|max:150',
            'emergency_pesan' => 'required_if:emergency_active,true|nullable|string|max:2000',
            'emergency_sampai' => 'nullable|date|after:now',
        ]);

        TaxiSetting::current()->update($data);

        return back()->with(
            'success',
            $data['emergency_active']
                ? 'Emergency override AKTIF — seluruh layar menampilkan pesan darurat.'
                : 'Emergency override dimatikan, layar kembali normal.'
        );
    }
}
