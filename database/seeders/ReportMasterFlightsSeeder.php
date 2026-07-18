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
        // PK-SNH (charter Smart Aviation) beroperasi hari Sabtu (sesuai report:
        // hanya terlihat terbang 18 Jul 2026 = Sabtu). Ubah bila jadwal berbeda.
        $hariCharter = ['Sabtu'];

        $rows = [
            ['departure', 'IW1472', 'IW',  'GHS', '09:00', 'A3', $semuaHari],
            ['departure', 'IU653',  'IU',  'SUB', '12:30', null, $semuaHari],
            ['departure', 'PK-SNH', 'SMV', 'RTU', '07:30', null, $hariCharter],
            ['departure', 'PK-SNH', 'SMV', 'DTD', '10:30', null, $hariCharter],
            ['arrival',   'IU652',  'IU',  'SUB', '11:50', null, $semuaHari],
            ['arrival',   'PK-SNH', 'SMV', 'RTU', '10:10', null, $hariCharter],
            ['arrival',   'PK-SNH', 'SMV', 'DTD', '15:20', null, $hariCharter],
        ];

        $created = 0;
        $updated = 0;
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
                // Sudah ada: selaraskan hari_operasi bila berbeda (seeder = sumber kebenaran).
                if ($flight->hari_operasi != $hari) {
                    $flight->update(['hari_operasi' => $hari]);
                    $updated++;
                    $this->command?->info("Update hari: {$jenis} {$nomor} {$jam}");
                } else {
                    $skipped++;
                    $this->command?->line("Lewati (sudah sesuai): {$jenis} {$nomor} {$jam}");
                }
            }
        }

        // 3) Sinkronisasi jam master keberangkatan yang SUDAH ADA dengan jam operasi
        //    terbaru dari report 18 Jul 2026. Match by nomor+jenis (unik untuk ini).
        $timeUpdates = [
            // Keberangkatan (report 18 Jul 2026)
            ['departure', 'QG461',  '11:00'],
            ['departure', 'GA581',  '12:20'],
            ['departure', 'ID6257', '13:00'],
            ['departure', 'IW1484', '14:05'],
            ['departure', 'QG423',  '15:00'],
            ['departure', 'ID6677', '17:35'],
            // Kedatangan (report 18 Jul 2026)
            ['arrival',   'QG460',  '10:30'],
            ['arrival',   'GA580',  '11:20'],
            ['arrival',   'ID6256', '12:20'],
            ['arrival',   'IW1485', '13:35'],
            ['arrival',   'QG422',  '14:30'],
            ['arrival',   'ID6676', '16:55'],
        ];
        $timeChanged = 0;
        foreach ($timeUpdates as [$jenis, $nomor, $jam]) {
            $q = Flight::where('is_master', true)
                ->where('jenis_penerbangan', $jenis)
                ->where('nomor_penerbangan', $nomor);

            // Amankan: hanya update bila tepat SATU master (hindari menyentuh
            // charter multi-leg yang bernomor sama).
            if ($q->count() !== 1) {
                continue;
            }
            $m = $q->first();
            if (substr((string) $m->jam_jadwal, 0, 5) !== $jam) {
                $m->update(['jam_jadwal' => $jam]);
                $timeChanged++;
                $this->command?->info("Sinkron jam: {$jenis} {$nomor} -> {$jam}");
            }
        }

        // 4) Aktifkan semua master yang hari_operasi-nya kosong menjadi operasi 7 hari
        //    (permintaan: "aktifkan semua = 7 hari"). Master ini sebelumnya tersimpan
        //    tapi tidak pernah muncul di jadwal harian karena tanpa hari operasi.
        $activated = 0;
        foreach (Flight::where('is_master', true)->get() as $m) {
            if (empty($m->hari_operasi)) {
                $m->update(['hari_operasi' => $semuaHari]);
                $activated++;
                $this->command?->info("Aktifkan 7 hari: {$m->jenis_penerbangan} {$m->nomor_penerbangan} " . substr((string) $m->jam_jadwal, 0, 5));
            }
        }

        $this->command?->info("Selesai. Dibuat: {$created}, diupdate hari: {$updated}, jam disinkron: {$timeChanged}, diaktifkan: {$activated}, dilewati: {$skipped}.");
    }
}
