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
            'teks_ticker' => $this->teks_ticker,
            'kecepatan_scroll' => $this->kecepatan_scroll,
            'durasi_tampilan' => $this->durasi_tampilan,
            'warna_utama' => $this->warna_utama,
            'warna_aksen' => $this->warna_aksen,
            'kode_bmkg' => $this->kode_bmkg,
            'lokasi_google_maps' => $this->lokasi_google_maps,
            'bahasa' => $this->bahasa ?? 'id',
        ];
    }
}
