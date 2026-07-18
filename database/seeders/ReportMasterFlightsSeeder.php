<?php

namespace Database\Seeders;

use App\Models\Airline;
use App\Models\Airport;
use App\Models\Flight;
use App\Models\Gate;
use Illuminate\Database\Seeder;

/**
 * Master penerbangan baru dari report 19 Jun–18 Jul 2026.
 *
 * ADITIF & IDEMPOTEN: hanya menambah yang belum ada (firstOrCreate),
 * tidak menghapus/mengubah master lain. Aman dijalankan berulang.
 *
 * Jalankan di server:
 *   php artisan db:seed --class=ReportMasterFlightsSeeder --force
 */
class ReportMasterFlightsSeeder extends Seeder
{
    public function run(): void
    {
        $semuaHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

        // 1) Data pendukung yang belum ada -----------------------------------
        Airline::firstOrCreate(
            ['kode_maskapai' => 'SMV'],
            ['nama_maskapai' => 'Smart Aviation']
        );
        Airport::firstOrCreate(
            ['kode_iata' => 'GHS'],
            ['nama_bandara' => 'Melalan', 'kota' => 'Kutai Barat', 'negara' => 'Indonesia']
        );

        // Bandara lokal (base) = AAP Samarinda. Wajib sudah ada.
        $aap = Airport::where('kode_iata', 'AAP')->first();
        if (!$aap) {
            $this->command?->error('Bandara AAP (Samarinda) tidak ditemukan — seeder dibatalkan.');
            return;
        }

        // 2) Definisi master baru --------------------------------------------
        // [jenis, nomor, kode_maskapai, kode_bandara_lawan, jam, kode_gate|null, hari|null]
        //  - departure: kode_bandara_lawan = TUJUAN
        //  - arrival  : kode_bandara_lawan = ASAL
        $rows = [
            ['departure', 'IW1472', 'IW',  'GHS', '09:00', 'A3', $semuaHari],
            ['departure', 'IU653',  'IU',  'SUB', '12:30', null, $semuaHari],
            ['departure', 'PK-SNH', 'SMV', 'RTU', '07:30', null, null],
            ['departure', 'PK-SNH', 'SMV', 'DTD', '10:30', null, null],
            ['arrival',   'IU652',  'IU',  'SUB', '11:50', null, $semuaHari],
            ['arrival',   'PK-SNH', 'SMV', 'RTU', '10:10', null, null],
            ['arrival',   'PK-SNH', 'SMV', 'DTD', '15:20', null, null],
        ];

        $created = 0;
        $skipped = 0;

        foreach ($rows as [$jenis, $nomor, $kodeAirline, $kodeLawan, $jam, $kodeGate, $hari]) {
            $airline = Airline::where('kode_maskapai', $kodeAirline)->first();
            $lawan   = Airport::where('kode_iata', $kodeLawan)->first();
            $gate    = $kodeGate ? Gate::where('kode_gate', $kodeGate)->first() : null;

            if (!$airline || !$lawan) {
                $this->command?->warn("Lewati {$jenis} {$nomor}: maskapai/bandara ({$kodeAirline}/{$kodeLawan}) tidak ada.");
                $skipped++;
                continue;
            }

            $asalId   = $jenis === 'departure' ? $aap->id   : $lawan->id;
            $tujuanId = $jenis === 'departure' ? $lawan->id : $aap->id;

            // Kunci unik: is_master + jenis + nomor + jam + tujuan.
            $flight = Flight::firstOrCreate(
                [
                    'is_master'         => true,
                    'jenis_penerbangan' => $jenis,
                    'nomor_penerbangan' => $nomor,
                    'jam_jadwal'        => $jam,
                    'airport_tujuan_id' => $tujuanId,
                ],
                [
                    'tanggal_penerbangan' => null,
                    'airline_id'          => $airline->id,
                    'airport_asal_id'     => $asalId,
                    'tipe_layanan'        => 'domestik',
                    'gate_id'             => $gate?->id,
                    'hari_operasi'        => $hari,
                    'status'              => 'Scheduled',
                ]
            );

            if ($flight->wasRecentlyCreated) {
                $created++;
                $this->command?->info("Tambah: {$jenis} {$nomor} {$jam}");
            } else {
                $skipped++;
                $this->command?->line("Lewati (sudah ada): {$jenis} {$nomor} {$jam}");
            }
        }

        $this->command?->info("Selesai. Dibuat: {$created}, dilewati: {$skipped}.");
    }
}
