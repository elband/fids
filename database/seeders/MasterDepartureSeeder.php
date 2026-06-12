<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Flight;
use App\Models\Airport;
use App\Models\Airline;
use App\Models\Gate;
use App\Models\CheckinCounter;

class MasterDepartureSeeder extends Seeder
{
    public function run(): void
    {
        $aap = Airport::where('kode_iata', 'AAP')->first();
        if (!$aap) return;

        // Hapus semua master departure yang lama
        $oldIds = Flight::where('is_master', true)
            ->where('jenis_penerbangan', 'departure')
            ->pluck('id');

        \DB::table('flight_checkin_counter')->whereIn('flight_id', $oldIds)->delete();
        Flight::whereIn('id', $oldIds)->delete();

        $semuaHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

        // [nomor_penerbangan, jam, kode_maskapai, kode_iata_tujuan, [cc_numbers], kode_gate, hari_operasi]
        $flights = [
            ['PKSNT',  '08:00', 'SNT', 'M-HU', [16],     'B1', []],
            ['PKSNT',  '08:50', 'SNT', 'LPU',  [16],     'B1', []],
            ['PKSNT',  '09:20', 'SNT', 'RTU',  [16],     'B1', []],
            ['IU641',  '09:25', 'IU',  'SUB',  [14],     'A2', $semuaHari],
            ['QG461',  '10:40', 'QG',  'SUB',  [3],      'B1', $semuaHari],
            ['IW1484', '11:50', 'IW',  'BEJ',  [12],     'A3', $semuaHari],
            ['GA581',  '12:05', 'GA',  'CGK',  [5],      'B1', $semuaHari],
            ['IU659',  '13:30', 'IU',  'YIA',  [13],     'A2', []],
            ['PKSNT',  '13:30', 'SNT', 'DTD',  [16],     'B1', []],
            ['ID6257', '13:50', 'ID',  'CGK',  [11, 12], 'A1', $semuaHari],
            ['IU643',  '14:00', 'IU',  'SUB',  [14],     'A2', []],
            ['QG423',  '15:40', 'QG',  'CGK',  [2, 3],   'B1', $semuaHari],
            ['ID6677', '18:30', 'ID',  'CGK',  [1],      'A1', $semuaHari],
        ];

        foreach ($flights as $row) {
            [$noFlight, $jam, $kodeAirline, $kodeTujuan, $ccNumbers, $kodeGate, $hari] = $row;

            $airline = Airline::where('kode_maskapai', $kodeAirline)->first();
            $tujuan  = Airport::where('kode_iata', $kodeTujuan)->first();
            $gate    = Gate::where('kode_gate', $kodeGate)->first();

            if (!$airline || !$tujuan || !$gate) continue;

            $flight = Flight::create([
                'nomor_penerbangan'  => $noFlight,
                'airline_id'         => $airline->id,
                'airport_asal_id'    => $aap->id,
                'airport_tujuan_id'  => $tujuan->id,
                'jenis_penerbangan'  => 'departure',
                'jam_jadwal'         => $jam,
                'is_master'          => true,
                'hari_operasi'       => empty($hari) ? null : $hari,
                'status'             => 'Scheduled',
                'gate_id'            => $gate->id,
            ]);

            $ccIds = CheckinCounter::whereIn('nomor_counter',
                array_map(fn($n) => str_pad($n, 2, '0', STR_PAD_LEFT), $ccNumbers)
            )->pluck('id');

            if ($ccIds->isNotEmpty()) {
                $flight->checkinCounters()->attach($ccIds);
            }
        }
    }
}
