<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WeatherResource extends JsonResource
{
    /**
     * Nama field di sini mengikuti nama kolom (bahasa Indonesia), sama seperti
     * resource FIDS lainnya.
     *
     * Sebelumnya resource ini mengirim 'humidity', 'wind_speed' dan 'icon' —
     * tidak satu pun merupakan kolom tabel maupun accessor model, sehingga
     * ketiganya selalu bernilai null dan data angin yang sudah tersimpan tidak
     * pernah sampai ke layar.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'lokasi' => $this->lokasi,
            'suhu' => round((float) $this->suhu),
            'kondisi_cuaca' => $this->kondisi_cuaca,
            'kelembapan' => $this->kelembapan !== null ? (int) $this->kelembapan : null,
            // BMKG mengirim kecepatan angin dalam km/jam.
            'kecepatan_angin' => $this->kecepatan_angin !== null ? (float) $this->kecepatan_angin : null,
            'arah_angin' => $this->arah_angin,
            'arah_angin_derajat' => $this->arah_angin_derajat !== null ? (int) $this->arah_angin_derajat : null,
            'jarak_pandang' => $this->jarak_pandang !== null ? (int) $this->jarak_pandang : null,
            'jarak_pandang_teks' => $this->jarak_pandang_teks,
            'tutupan_awan' => $this->tutupan_awan !== null ? (int) $this->tutupan_awan : null,
            // Jam berlaku slot prakiraan (ISO 8601, UTC) — beda dengan waktu ambil data.
            'berlaku_pada' => optional($this->berlaku_pada)->toIso8601String(),
            // Harus string, bukan objek Carbon: hasil resolve() disimpan di cache dan
            // config cache.serializable_classes = false membuat objek kembali sebagai
            // __PHP_Incomplete_Class, sehingga layar selalu menulis "diperbarui belum pernah".
            'last_updated' => optional($this->updated_at)->toIso8601String(),
        ];
    }
}
