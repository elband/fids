<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Airport;
use App\Models\Airline;
use App\Models\Route;
use App\Models\Gate;
use App\Models\CheckinCounter;
use App\Models\BaggageClaim;
use App\Models\Flight;
use Carbon\Carbon;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Airports
        $aptPranoto = Airport::firstOrCreate(['kode_iata' => 'AAP'], ['nama_bandara' => 'Aji Pangeran Tumenggung Pranoto', 'kota' => 'Samarinda', 'negara' => 'Indonesia']);
        $cgk = Airport::firstOrCreate(['kode_iata' => 'CGK'], ['nama_bandara' => 'Soekarno-Hatta', 'kota' => 'Jakarta', 'negara' => 'Indonesia']);
        $sub = Airport::firstOrCreate(['kode_iata' => 'SUB'], ['nama_bandara' => 'Juanda', 'kota' => 'Surabaya', 'negara' => 'Indonesia']);
        $bpn = Airport::firstOrCreate(['kode_iata' => 'BPN'], ['nama_bandara' => 'Sepinggan', 'kota' => 'Balikpapan', 'negara' => 'Indonesia']);
        $upg = Airport::firstOrCreate(['kode_iata' => 'UPG'], ['nama_bandara' => 'Sultan Hasanuddin', 'kota' => 'Makassar', 'negara' => 'Indonesia']);
        $bej = Airport::firstOrCreate(['kode_iata' => 'BEJ'], ['nama_bandara' => 'Kalimarau', 'kota' => 'Berau', 'negara' => 'Indonesia']);

        // 2. Airlines
        $garuda = Airline::firstOrCreate(['kode_maskapai' => 'GA'], ['nama_maskapai' => 'Garuda Indonesia', 'warna_identitas' => '#005b9f']);
        $lion = Airline::firstOrCreate(['kode_maskapai' => 'JT'], ['nama_maskapai' => 'Lion Air', 'warna_identitas' => '#ed1b24']);
        $batik = Airline::firstOrCreate(['kode_maskapai' => 'ID'], ['nama_maskapai' => 'Batik Air', 'warna_identitas' => '#8f0000']);
        $super = Airline::firstOrCreate(['kode_maskapai' => 'IU'], ['nama_maskapai' => 'Super Air Jet', 'warna_identitas' => '#ffcc00']);
        $citilink = Airline::firstOrCreate(['kode_maskapai' => 'QG'], ['nama_maskapai' => 'Citilink', 'warna_identitas' => '#009a44']);
        $wings = Airline::firstOrCreate(['kode_maskapai' => 'IW'], ['nama_maskapai' => 'Wings Air', 'warna_identitas' => '#ed1b24']);

        // 3. Routes
        Route::firstOrCreate(['airport_asal_id' => $aptPranoto->id, 'airport_tujuan_id' => $cgk->id], ['tipe_layanan' => 'domestik']);
        Route::firstOrCreate(['airport_asal_id' => $aptPranoto->id, 'airport_tujuan_id' => $sub->id], ['tipe_layanan' => 'domestik']);
        Route::firstOrCreate(['airport_asal_id' => $aptPranoto->id, 'airport_tujuan_id' => $bpn->id], ['tipe_layanan' => 'domestik']);
        Route::firstOrCreate(['airport_asal_id' => $aptPranoto->id, 'airport_tujuan_id' => $upg->id], ['tipe_layanan' => 'domestik']);
        Route::firstOrCreate(['airport_asal_id' => $aptPranoto->id, 'airport_tujuan_id' => $bej->id], ['tipe_layanan' => 'domestik']);
        Route::firstOrCreate(['airport_asal_id' => $cgk->id, 'airport_tujuan_id' => $aptPranoto->id], ['tipe_layanan' => 'domestik']);

        // 4. Gates
        for ($i = 1; $i <= 4; $i++) {
            Gate::firstOrCreate(['kode_gate' => "G$i"], ['nama_gate' => "Gate $i", 'terminal' => 'Domestik']);
        }

        // 5. Check-in Counters
        for ($i = 1; $i <= 12; $i++) {
            CheckinCounter::firstOrCreate(['nomor_counter' => str_pad($i, 2, '0', STR_PAD_LEFT)], ['area' => 'Keberangkatan', 'terminal' => 'Domestik']);
        }

        // 6. Baggage Claims
        for ($i = 1; $i <= 3; $i++) {
            BaggageClaim::firstOrCreate(['nomor_belt' => "B$i"], ['area' => 'Kedatangan', 'terminal' => 'Domestik']);
        }

        // 7. Dummy Flights
        $today = Carbon::today();
        
        // Departure
        Flight::firstOrCreate(['nomor_penerbangan' => 'ID-6257', 'tanggal_penerbangan' => $today->format('Y-m-d')], [
            'airline_id' => $batik->id,
            'airport_asal_id' => $aptPranoto->id,
            'airport_tujuan_id' => $cgk->id,
            'jam_jadwal' => '10:00:00',
            'jenis_penerbangan' => 'departure',
            'tipe_layanan' => 'domestik',
            'gate_id' => 1,
            'checkin_counter_id' => 1,
            'status' => 'Boarding'
        ]);

        // Arrival
        Flight::firstOrCreate(['nomor_penerbangan' => 'GA-500', 'tanggal_penerbangan' => $today->format('Y-m-d')], [
            'airline_id' => $garuda->id,
            'airport_asal_id' => $cgk->id,
            'airport_tujuan_id' => $aptPranoto->id,
            'jam_jadwal' => '11:30:00',
            'jenis_penerbangan' => 'arrival',
            'tipe_layanan' => 'domestik',
            'baggage_claim_id' => 1,
            'status' => 'Landed'
        ]);
    }
}
