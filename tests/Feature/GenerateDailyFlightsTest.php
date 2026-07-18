<?php

namespace Tests\Feature;

use App\Models\Airline;
use App\Models\Airport;
use App\Models\Flight;
use App\Services\FlightService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regresi: generate-harian harus membuat SEMUA leg walau nomor penerbangan sama
 * (mis. charter PK-SNH ke dua rute berbeda di hari yang sama).
 */
class GenerateDailyFlightsTest extends TestCase
{
    use RefreshDatabase;

    public function test_generates_both_legs_of_same_flight_number(): void
    {
        $airline = Airline::create(['kode_maskapai' => 'SMV', 'nama_maskapai' => 'Smart Aviation']);
        $aap = Airport::create(['kode_iata' => 'AAP', 'nama_bandara' => 'APT Pranoto', 'kota' => 'Samarinda', 'negara' => 'Indonesia']);
        $rtu = Airport::create(['kode_iata' => 'RTU', 'nama_bandara' => 'Maratua', 'kota' => 'Berau', 'negara' => 'Indonesia']);
        $dtd = Airport::create(['kode_iata' => 'DTD', 'nama_bandara' => 'Datah Dawai', 'kota' => 'Mahakam Ulu', 'negara' => 'Indonesia']);

        $base = [
            'is_master'         => true,
            'tanggal_penerbangan' => null,
            'nomor_penerbangan' => 'PK-SNH',
            'airline_id'        => $airline->id,
            'airport_asal_id'   => $aap->id,
            'jenis_penerbangan' => 'departure',
            'tipe_layanan'      => 'domestik',
            'status'            => 'Scheduled',
            'hari_operasi'      => ['Sabtu'],
        ];

        // Dua leg dengan nomor SAMA, jam & tujuan berbeda.
        Flight::create(array_merge($base, ['jam_jadwal' => '07:30:00', 'airport_tujuan_id' => $rtu->id]));
        Flight::create(array_merge($base, ['jam_jadwal' => '10:30:00', 'airport_tujuan_id' => $dtd->id]));

        // 2026-07-18 = Sabtu
        $count = app(FlightService::class)->generateDailyFlights(Carbon::parse('2026-07-18'));

        $this->assertSame(2, $count, 'Kedua leg PK-SNH harus ter-generate');
        $this->assertSame(2, Flight::where('is_master', false)
            ->where('nomor_penerbangan', 'PK-SNH')->count());
    }

    public function test_generate_is_idempotent_no_duplicates_on_rerun(): void
    {
        $airline = Airline::create(['kode_maskapai' => 'SMV', 'nama_maskapai' => 'Smart Aviation']);
        $aap = Airport::create(['kode_iata' => 'AAP', 'nama_bandara' => 'APT Pranoto', 'kota' => 'Samarinda', 'negara' => 'Indonesia']);
        $rtu = Airport::create(['kode_iata' => 'RTU', 'nama_bandara' => 'Maratua', 'kota' => 'Berau', 'negara' => 'Indonesia']);

        Flight::create([
            'is_master' => true, 'tanggal_penerbangan' => null, 'nomor_penerbangan' => 'PK-SNH',
            'airline_id' => $airline->id, 'airport_asal_id' => $aap->id, 'airport_tujuan_id' => $rtu->id,
            'jenis_penerbangan' => 'departure', 'tipe_layanan' => 'domestik', 'status' => 'Scheduled',
            'jam_jadwal' => '07:30:00', 'hari_operasi' => ['Sabtu'],
        ]);

        $svc = app(FlightService::class);
        $svc->generateDailyFlights(Carbon::parse('2026-07-18'));
        $second = $svc->generateDailyFlights(Carbon::parse('2026-07-18'));

        $this->assertSame(0, $second, 'Run kedua tidak boleh membuat duplikat');
        $this->assertSame(1, Flight::where('is_master', false)->count());
    }
}
