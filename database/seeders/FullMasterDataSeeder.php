<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Airport;
use App\Models\Airline;
use App\Models\Flight;
use App\Models\Gate;
use App\Models\CheckinCounter;
use Carbon\Carbon;

class FullMasterDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ensure Airlines Exist
        $airlines = [
            'SNT' => ['name' => 'Susi Air', 'color' => '#8bc34a'],
            'IU'  => ['name' => 'Super Air Jet', 'color' => '#ffcc00'],
            'QG'  => ['name' => 'Citilink', 'color' => '#009a44'],
            'IW'  => ['name' => 'Wings Air', 'color' => '#ed1b24'],
            'GA'  => ['name' => 'Garuda Indonesia', 'color' => '#005b9f'],
            'ID'  => ['name' => 'Batik Air', 'color' => '#8f0000'],
        ];

        foreach ($airlines as $code => $info) {
            Airline::updateOrCreate(['kode_maskapai' => $code], [
                'nama_maskapai' => $info['name'],
                'warna_identitas' => $info['color'],
                'status_aktif' => true
            ]);
        }

        // 2. Ensure Airports Exist
        $aptPranoto = Airport::where('kode_iata', 'AAP')->first();
        $cgk = Airport::updateOrCreate(['kode_iata' => 'CGK'], ['nama_bandara' => 'Soekarno-Hatta', 'kota' => 'Tangerang', 'negara' => 'Indonesia']);
        $sub = Airport::updateOrCreate(['kode_iata' => 'SUB'], ['nama_bandara' => 'Juanda', 'kota' => 'Sidoarjo', 'negara' => 'Indonesia']);
        $yia = Airport::updateOrCreate(['kode_iata' => 'YIA'], ['nama_bandara' => 'Yogyakarta International', 'kota' => 'Yogyakarta', 'negara' => 'Indonesia']);
        $bej = Airport::updateOrCreate(['kode_iata' => 'BEJ'], ['nama_bandara' => 'Kalimarau', 'kota' => 'Berau', 'negara' => 'Indonesia']);
        
        // Local Samarinda destinations
        $whu = Airport::updateOrCreate(['kode_iata' => 'M-HU'], ['nama_bandara' => 'Wahau', 'kota' => 'Kutai Timur', 'negara' => 'Indonesia']);
        $lpu = Airport::updateOrCreate(['kode_iata' => 'LPU'], ['nama_bandara' => 'Long Apung', 'kota' => 'Malinau', 'negara' => 'Indonesia']);
        $rtu = Airport::updateOrCreate(['kode_iata' => 'RTU'], ['nama_bandara' => 'Maratua', 'kota' => 'Berau', 'negara' => 'Indonesia']);
        $dtd = Airport::updateOrCreate(['kode_iata' => 'DTD'], ['nama_bandara' => 'Datah Dawai', 'kota' => 'Mahakam Ulu', 'negara' => 'Indonesia']);

        // 3. Ensure Gates Exist
        $gateCodes = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];
        foreach ($gateCodes as $code) {
            Gate::updateOrCreate(['kode_gate' => $code], ['nama_gate' => "Gate $code", 'terminal' => 'Domestik']);
        }

        // 4. Ensure Counters Exist
        for ($i = 1; $i <= 20; $i++) {
            CheckinCounter::updateOrCreate(['nomor_counter' => str_pad($i, 2, '0', STR_PAD_LEFT)], ['area' => 'Keberangkatan', 'terminal' => 'Domestik']);
        }

        // 5. Flight Data from Screenshot
        $flights = [
            ['code' => 'PK-SNT', 'time' => '08:00', 'dest' => $whu->id, 'airline' => 'SNT', 'gate' => 'B1', 'cc' => 16],
            ['code' => 'PK-SNT', 'time' => '08:50', 'dest' => $lpu->id, 'airline' => 'SNT', 'gate' => 'B1', 'cc' => 16],
            ['code' => 'PK-SNT', 'time' => '09:20', 'dest' => $rtu->id, 'airline' => 'SNT', 'gate' => 'B1', 'cc' => 16],
            ['code' => 'IU-641',  'time' => '09:25', 'dest' => $sub->id, 'airline' => 'IU',  'gate' => 'A2', 'cc' => 14],
            ['code' => 'QG-461',  'time' => '10:40', 'dest' => $sub->id, 'airline' => 'QG',  'gate' => 'B1', 'cc' => 3],
            ['code' => 'IW-1484', 'time' => '11:50', 'dest' => $bej->id, 'airline' => 'IW',  'gate' => 'A3', 'cc' => 12],
            ['code' => 'GA-581',  'time' => '12:05', 'dest' => $cgk->id, 'airline' => 'GA',  'gate' => 'B1', 'cc' => 5],
            ['code' => 'IU-659',  'time' => '13:30', 'dest' => $yia->id, 'airline' => 'IU',  'gate' => 'A2', 'cc' => 13],
            ['code' => 'PK-SNT', 'time' => '13:30', 'dest' => $dtd->id, 'airline' => 'SNT', 'gate' => 'B1', 'cc' => 16],
            ['code' => 'ID-6257', 'time' => '13:50', 'dest' => $cgk->id, 'airline' => 'ID',  'gate' => 'A1', 'cc' => 11],
            ['code' => 'IU-643',  'time' => '14:00', 'dest' => $sub->id, 'airline' => 'IU',  'gate' => 'A2', 'cc' => 14],
            ['code' => 'QG-423',  'time' => '15:40', 'dest' => $cgk->id, 'airline' => 'QG',  'gate' => 'B1', 'cc' => 2],
            ['code' => 'ID-6677', 'time' => '18:30', 'dest' => $cgk->id, 'airline' => 'ID',  'gate' => 'A1', 'cc' => 1],
        ];

        foreach ($flights as $f) {
            $airline = Airline::where('kode_maskapai', $f['airline'])->first();
            $gate = Gate::where('kode_gate', $f['gate'])->first();
            $cc = CheckinCounter::where('nomor_counter', str_pad($f['cc'], 2, '0', STR_PAD_LEFT))->first();

            // Create Master Flight
            Flight::updateOrCreate([
                'nomor_penerbangan' => $f['code'],
                'jam_jadwal' => $f['time'] . ':00',
                'is_master' => true,
            ], [
                'airline_id' => $airline->id,
                'airport_asal_id' => $aptPranoto->id,
                'airport_tujuan_id' => $f['dest'],
                'jenis_penerbangan' => 'departure',
                'tipe_layanan' => 'domestik',
                'gate_id' => $gate->id,
                'checkin_counter_id' => $cc->id,
                'hari_operasi' => json_encode([1, 2, 3, 4, 5, 6, 7]), // Active everyday based on screenshot badges
                'status' => 'Scheduled',
            ]);
        }
    }
}
