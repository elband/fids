<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Flight;
use App\Models\Airport;
use App\Models\Airline;

class MasterArrivalSeeder extends Seeder
{
    public function run(): void
    {
        $aap = Airport::where('kode_iata', 'AAP')->first();
        if (!$aap) return;

        // Hapus semua master arrival yang lama
        $oldIds = Flight::where('is_master', true)
            ->where('jenis_penerbangan', 'arrival')
            ->pluck('id');

        Flight::whereIn('id', $oldIds)->delete();

        $semuaHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

        // [nomor_penerbangan, jam, kode_maskapai, kode_iata_asal, hari_operasi]
        $flights = [
            ['ID6672',  '08:10', 'ID', 'CGK', $semuaHari],
            ['IU640',   '08:45', 'IU', 'SUB', $semuaHari],
            ['QG460',   '10:30', 'QG', 'SUB', $semuaHari],
            ['GA580',   '11:20', 'GA', 'CGK', $semuaHari],
            ['IW1485',  '13:35', 'IW', 'BEJ', $semuaHari],
            ['IU658',   '12:50', 'IU', 'YIA', $semuaHari],
            ['ID6256',  '12:20', 'ID', 'CGK', $semuaHari],
            ['IU642',   '13:20', 'IU', 'SUB', $semuaHari],
            ['QG422',   '14:30', 'QG', 'CGK', $semuaHari],
            ['ID6676',  '16:55', 'ID', 'CGK', $semuaHari],
        ];

        foreach ($flights as $row) {
            [$noFlight, $jam, $kodeAirline, $kodeAsal, $hari] = $row;

            $airline = Airline::where('kode_maskapai', $kodeAirline)->first();
            $asal    = Airport::where('kode_iata', $kodeAsal)->first();

            if (!$airline || !$asal) continue;

            Flight::create([
                'nomor_penerbangan'  => $noFlight,
                'airline_id'         => $airline->id,
                'airport_asal_id'    => $asal->id,
                'airport_tujuan_id'  => $aap->id,
                'jenis_penerbangan'  => 'arrival',
                'jam_jadwal'         => $jam,
                'is_master'          => true,
                'hari_operasi'       => empty($hari) ? null : $hari,
                'status'             => 'Estimate',
            ]);
        }
    }
}
