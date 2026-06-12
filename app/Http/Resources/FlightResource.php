<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FlightResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $airline = [
            'nama' => $this->airline->nama_maskapai ?? null,
            'logo' => $this->airline->logo ? '/storage/' . $this->airline->logo : null,
            'warna' => $this->airline->warna_identitas ?? '#ffffff',
        ];

        return [
            'id' => $this->id,
            'waktu' => substr($this->jam_jadwal, 0, 5),
            'jam_jadwal' => $this->jam_jadwal, // Backward compatibility
            'nomor_penerbangan' => $this->nomor_penerbangan,
            'jenis_penerbangan' => $this->jenis_penerbangan,
            'tipe_layanan' => $this->tipe_layanan,
            // Disediakan dalam dua nama untuk kompatibilitas UI lama (airline) dan resource lama (maskapai)
            'airline' => $airline,
            'maskapai' => $airline,
            'asal' => $this->airportAsal->kota ?? $this->airportAsal->nama_bandara ?? null,
            'tujuan' => $this->airportTujuan->kota ?? $this->airportTujuan->nama_bandara ?? null,
            'gate' => $this->gate->nama_gate ?? $this->gate->kode_gate ?? null,
            'checkin_counter' => $this->checkinCounters && $this->checkinCounters->count() > 0
                ? $this->checkinCounters->pluck('nomor_counter')->implode(', ')
                : ($this->checkinCounter->nomor_counter ?? null),
            'baggage_claim' => $this->baggageClaim->nomor_belt ?? null,
            'status' => $this->status,
            'catatan' => $this->catatan,
        ];
    }
}
