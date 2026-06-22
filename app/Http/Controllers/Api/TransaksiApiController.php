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

        $paginator->getCollection()->transform(fn (Flight $f) => $this->transform($f));

        return $this->envelope('Keberangkatan', $paginator);
    }

    /**
     * Daftar transaksi kedatangan (arrival).
     */
    public function kedatangan(Request $request)
    {
        $paginator = $this->baseQuery('arrival')->paginate(self::PER_PAGE);

        $paginator->getCollection()->transform(fn (Flight $f) => $this->transform($f));

        return $this->envelope('Kedatangan', $paginator);
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
     */
    private function transform(Flight $f): array
    {
        return [
            'id'                => $f->id,
            'tanggal'           => optional($f->tanggal_penerbangan)->format('Y-m-d'),
            'nomor_penerbangan' => $f->nomor_penerbangan,
            'maskapai'          => $f->airline->nama_maskapai ?? null,
            'kode_maskapai'     => $f->airline->kode_maskapai ?? null,
            'asal'              => $f->airportAsal->kota ?? $f->airportAsal->nama_bandara ?? null,
            'kode_asal'         => $f->airportAsal->kode_iata ?? null,
            'tujuan'            => $f->airportTujuan->kota ?? $f->airportTujuan->nama_bandara ?? null,
            'kode_tujuan'       => $f->airportTujuan->kode_iata ?? null,
            'jam_jadwal'        => $f->jam_jadwal ? substr($f->jam_jadwal, 0, 5) : null,
            'jam_estimasi'      => $f->jam_estimasi ? substr($f->jam_estimasi, 0, 5) : null,
            'jam_aktual'        => $f->jam_aktual ? substr($f->jam_aktual, 0, 5) : null,
            'jenis_penerbangan' => $f->jenis_penerbangan,
            'tipe_layanan'      => $f->tipe_layanan,
            'gate'              => $f->gate->kode_gate ?? null,
            'checkin_counter'   => $f->checkinCounters && $f->checkinCounters->count() > 0
                ? $f->checkinCounters->pluck('nomor_counter')->implode(', ')
                : ($f->checkinCounter->nomor_counter ?? null),
            'baggage_claim'     => $f->baggageClaim->nomor_belt ?? null,
            'status'            => $f->status,
            'catatan'           => $f->catatan,
        ];
    }
}
