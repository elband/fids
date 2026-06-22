<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Flight;
use Illuminate\Http\Request;

/**
 * API Transaksi Penerbangan (publik).
 *
 * Meniru format endpoint referensi:
 *   http://103.210.122.2/api/transaksi/kedatangan
 *   http://103.210.122.2/api/transaksi/keberangkatan
 *
 * Envelope: { data: { sukses, pesan, result: <Laravel paginator per_page 5> } }
 */
class TransaksiApiController extends Controller
{
    /** Jumlah baris per halaman, mengikuti referensi (per_page = 5). */
    private const PER_PAGE = 5;

    /**
     * Daftar transaksi keberangkatan (departure).
     */
    public function keberangkatan(Request $request)
    {
        $paginator = $this->baseQuery('departure')->paginate(self::PER_PAGE);

        $paginator->getCollection()->transform(fn (Flight $f) => $this->stripNulls($this->transform($f)));

        return $this->envelope('Keberangkatan', $paginator);
    }

    /**
     * Daftar transaksi kedatangan (arrival).
     */
    public function kedatangan(Request $request)
    {
        $paginator = $this->baseQuery('arrival')->paginate(self::PER_PAGE);

        $paginator->getCollection()->transform(fn (Flight $f) => $this->stripNulls($this->transform($f)));

        return $this->envelope('Kedatangan', $paginator);
    }

    /**
     * Hapus seluruh nilai null (rekursif, termasuk di objek bersarang) dari record.
     * Objek bersarang yang menjadi kosong setelah dibersihkan ikut dihapus.
     */
    private function stripNulls(array $arr): array
    {
        $out = [];
        foreach ($arr as $key => $value) {
            if (is_array($value)) {
                $value = $this->stripNulls($value);
                if (!empty($value)) {
                    $out[$key] = $value;
                }
            } elseif ($value !== null) {
                $out[$key] = $value;
            }
        }
        return $out;
    }

    /**
     * Query dasar: penerbangan harian (bukan master), terbaru lebih dulu.
     */
    private function baseQuery(string $jenis)
    {
        return Flight::with([
                'airline', 'airportAsal', 'airportTujuan',
                'gate', 'checkinCounter', 'checkinCounters', 'baggageClaim',
            ])
            ->where('is_master', false)
            ->where('jenis_penerbangan', $jenis)
            ->orderByDesc('tanggal_penerbangan')
            ->orderBy('jam_jadwal');
    }

    /**
     * Susun envelope respons agar identik dengan API referensi.
     */
    private function envelope(string $label, $paginator)
    {
        return response()->json([
            'data' => [
                'sukses' => true,
                'pesan'  => "Data {$label}:" . $paginator->total(),
                'result' => $paginator,
            ],
        ]);
    }

    /**
     * Transformasi satu penerbangan menjadi baris transaksi.
     * Struktur mengikuti API referensi (maskapai/gate/bandara/remark/reason bersarang;
     * logo berada di dalam objek "maskapai").
     */
    private function transform(Flight $f): array
    {
        $isDeparture = $f->jenis_penerbangan === 'departure';

        // Objek maskapai (memuat logo) — sejajar dengan referensi.
        $maskapai = $f->airline ? [
            'id'         => $f->airline->id,
            'nama'       => $f->airline->nama_maskapai,
            'kode'       => $f->airline->kode_maskapai,
            'logo'       => $f->airline->logo ? '/storage/' . $f->airline->logo : null,
            'kode_warna' => $f->airline->warna_identitas,
        ] : null;

        $airportObj = function ($a) {
            return $a ? [
                'id'            => $a->id,
                'nama'          => $a->nama_bandara,
                'iata'          => $a->kode_iata,
                'kota_provinsi' => $a->kota,
            ] : null;
        };

        // Nomor counter pertama sebagai integer (sesuai referensi: "konter": 14)
        $konterRaw = ($f->checkinCounters && $f->checkinCounters->count() > 0)
            ? $f->checkinCounters->first()->nomor_counter
            : ($f->checkinCounter->nomor_counter ?? null);

        $base = [
            'id'          => $f->id,
            'tanggal'     => optional($f->tanggal_penerbangan)->format('Y-m-d'),
            'maskapai_id' => $f->airline_id,
            'pesawat_id'  => null,
            'rute_id'     => null,
            'bandara_id'  => $isDeparture ? $f->airport_tujuan_id : $f->airport_asal_id,
            'jam'         => $f->jam_jadwal ? substr($f->jam_jadwal, 0, 5) : null,
            'is_extra'    => 0,
            'is_force'    => 0,
            'keterangan'  => $f->catatan,
            'remark_id'   => null,
            'reason_id'   => 0,
            'created_at'  => $f->created_at,
            'updated_at'  => $f->updated_at,
            'maskapai'    => $maskapai,
            'pesawat'     => ['kode_penerbangan' => $f->nomor_penerbangan, 'jenis' => null, 'tipe' => null],
            'remark'      => ['id' => null, 'status' => $f->status],
            'reason'      => ['id' => 0, 'deskripsi' => '---'],
        ];

        if ($isDeparture) {
            return array_merge($base, [
                'konter'         => $konterRaw !== null ? (int) $konterRaw : 0,
                'konter2'        => 0,
                'konter3'        => 0,
                'gate_id'        => $f->gate_id,
                'gate'           => $f->gate ? ['id' => $f->gate->id, 'nama' => $f->gate->kode_gate] : null,
                'bandara_tujuan' => $airportObj($f->airportTujuan),
            ]);
        }

        return array_merge($base, [
            'conveyor'     => $f->baggageClaim->nomor_belt ?? null,
            'bandara_asal' => $airportObj($f->airportAsal),
        ]);
    }
}
