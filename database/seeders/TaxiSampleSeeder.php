<?php

namespace Database\Seeders;

use App\Models\TaxiCounter;
use App\Models\TaxiDirection;
use App\Models\TaxiFare;
use App\Models\TaxiRunningText;
use Illuminate\Database\Seeder;

/**
 * Konten contoh modul Taxi Information — untuk demo/uji tampilan saja.
 * TIDAK dipanggil dari DatabaseSeeder; jalankan manual bila diperlukan:
 *   php artisan db:seed --class=TaxiSampleSeeder
 * Video sengaja tidak diikutkan karena butuh berkas MP4 nyata.
 */
class TaxiSampleSeeder extends Seeder
{
    public function run(): void
    {
        TaxiDirection::firstOrCreate(
            ['judul' => 'Counter Taksi Resmi — Pintu Kedatangan A'],
            [
                'judul_en' => 'Official Taxi Counter — Arrival Gate A',
                'deskripsi' => 'Keluar dari area pengambilan bagasi, ikuti koridor ke kanan sampai menemukan konter berlogo resmi bandara.',
                'deskripsi_en' => 'Exit the baggage claim area and follow the corridor to the right until you find the official airport counter.',
                'jarak_meter' => 120,
                'estimasi_menit' => 3,
                'is_active' => true,
                'order_index' => 1,
            ],
        );

        // Delapan counter taksi; jumlah dan isinya bebas diubah lewat panel admin.
        $counters = [
            ['01', 'Bluebird Group', 'Taksi Reguler', '→'],
            ['02', 'Express Taksi', 'Taksi Reguler', '→'],
            ['03', 'Koperasi Taksi Bandara', 'Taksi Reguler', '↗'],
            ['04', 'Silver Bird', 'Taksi Eksekutif', '↗'],
            ['05', 'Taksi Bandara Kaltim', 'Taksi Reguler', '↑'],
            ['06', 'Prima Trans', 'Taksi Eksekutif', '↑'],
            ['07', 'Airport Shuttle', 'Shuttle Bandara', '↘'],
            ['08', 'Taksi Online Resmi', 'Taksi Daring', '→'],
        ];

        foreach ($counters as $i => [$nomor, $operator, $layanan, $arah]) {
            TaxiCounter::firstOrCreate(
                ['nomor' => $nomor],
                [
                    'nama_operator' => $operator,
                    'jenis_layanan' => $layanan,
                    'arah' => $arah,
                    'is_active' => true,
                    'order_index' => $i + 1,
                ],
            );
        }

        $fares = [
            ['Samarinda', 'Samarinda Kota', 'Taksi Reguler', 250000, 1],
            ['Samarinda', 'Samarinda Seberang', 'Taksi Reguler', 275000, 2],
            ['Samarinda', 'Loa Janan', 'Taksi Reguler', 200000, 3],
            ['Balikpapan', 'Balikpapan Kota', 'Taksi Eksekutif', 600000, 1],
            ['Kutai Kartanegara', 'Tenggarong', 'Taksi Reguler', 300000, 1],
        ];

        foreach ($fares as [$wilayah, $tujuan, $kendaraan, $tarif, $urutan]) {
            TaxiFare::firstOrCreate(
                ['wilayah' => $wilayah, 'tujuan' => $tujuan],
                [
                    'jenis_kendaraan' => $kendaraan,
                    'tarif' => $tarif,
                    'is_active' => true,
                    'order_index' => $urutan,
                ],
            );
        }

        $texts = [
            ['Gunakan hanya taksi resmi bandara. Tarif tertera pada papan informasi.',
             'Please use official airport taxis only. Fares are shown on the information board.', '#fbbf24', 10],
            ['Layanan taksi bandara beroperasi 24 jam mengikuti jadwal penerbangan.',
             'Airport taxi service operates 24 hours following the flight schedule.', '#34d399', 5],
        ];

        foreach ($texts as [$pesan, $pesanEn, $warna, $prioritas]) {
            TaxiRunningText::firstOrCreate(
                ['pesan' => $pesan],
                ['pesan_en' => $pesanEn, 'warna' => $warna, 'prioritas' => $prioritas, 'is_active' => true],
            );
        }
    }
}
