<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SettingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nama_bandara' => $this->nama_bandara,
            'logo_bandara' => $this->logo_bandara ? asset('storage/' . $this->logo_bandara) : null,
            'background_header' => $this->background_header ? asset('storage/' . $this->background_header) : null,
            // Warna tema latar layar TV (hex, mis. "#0f172a"; nilai lawas "navy" dll.
            // dinormalisasi di frontend). Dipakai papan keberangkatan & kedatangan.
            'tema_warna' => $this->tema_warna,
            'teks_ticker' => $this->teks_ticker,
            'kecepatan_scroll' => $this->kecepatan_scroll,
            'durasi_tampilan' => $this->durasi_tampilan,
            // Warna teks papan: utama (jam/no.pnb/gate) & aksen (judul/header/tujuan).
            'warna_utama' => $this->warna_utama ?: '#ffffff',
            'warna_aksen' => $this->warna_aksen ?: '#fbbf24',
            'kode_bmkg' => $this->kode_bmkg,
            'lokasi_google_maps' => $this->lokasi_google_maps,
            'bahasa' => $this->bahasa ?? 'id',
            // Pengaturan timing baggage claim (menit).
            'bagasi_durasi_status_menit' => (int) ($this->bagasi_durasi_status_menit ?? 30),
            'bagasi_kamera_mulai_menit' => (int) ($this->bagasi_kamera_mulai_menit ?? 10),
            'bagasi_kamera_selesai_menit' => (int) ($this->bagasi_kamera_selesai_menit ?? 20),
            // Sinyal "segarkan semua layar TV" (epoch detik; null jika belum pernah).
            'force_reload_at' => optional($this->force_reload_at)->timestamp,
            // Interval auto-reload penuh tiap layar (jam; 0 = nonaktif).
            'auto_reload_jam' => (int) ($this->auto_reload_jam ?? 6),
        ];
    }
}
