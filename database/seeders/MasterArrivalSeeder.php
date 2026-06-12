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
            ['ID6672',  '08:10', 'ID', 'CGK', []],
            ['IU640',   '08:45', 'IU', 'SUB', $semuaHari],
            ['QG460',   '09:50', 'QG', 'SUB', $semuaHari],
            ['GA580',   '11:00', 'GA', 'CGK', $semuaHari],
            ['IW1485',  '11:30', 'IW', 'BEJ', $semuaHari],
            ['IU658',   '12:50', 'IU', 'YIA', []],
            ['ID6256',  '13:10', 'ID', 'CGK', $semuaHari],
            ['IU642',   '13:20', 'IU', 'SUB', []],
            ['QG422',   '15:10', 'QG', 'CGK', $semuaHari],
            ['ID6676',  '17:40', 'ID', 'CGK', $semuaHari],
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
