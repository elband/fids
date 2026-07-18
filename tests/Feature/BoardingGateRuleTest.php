<?php

namespace Tests\Feature;

use App\Models\Airline;
use App\Models\Airport;
use App\Models\Flight;
use App\Models\Gate;
use App\Support\DisplayTimezone;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regresi aturan operasional Boarding Gate:
 *  - Penerbangan muncul mulai 1 jam sebelum jam jadwal.
 *  - Satu gate hanya dipakai satu penerbangan (jadwal paling awal).
 *  - Hilang 5 menit setelah status "Departed".
 */
class BoardingGateRuleTest extends TestCase
{
    use RefreshDatabase;

    private string $tz;
    private Carbon $now;
    private int $airlineId;
    private int $asalId;
    private int $tujuanId;
    private int $gateId;
    private string $gateCode = 'G9';

    protected function setUp(): void
    {
        parent::setUp();

        // Pakai tz yang sama dengan controller agar perbandingan waktu selaras.
        $this->tz = DisplayTimezone::get();
        $this->now = Carbon::parse('2026-07-19 10:00:00', $this->tz);
        Carbon::setTestNow($this->now);

        $this->airlineId = Airline::create(['kode_maskapai' => 'IU', 'nama_maskapai' => 'Super Air Jet'])->id;
        $this->asalId = Airport::create(['kode_iata' => 'AAP', 'nama_bandara' => 'APT Pranoto', 'kota' => 'Samarinda', 'negara' => 'Indonesia'])->id;
        $this->tujuanId = Airport::create(['kode_iata' => 'SUB', 'nama_bandara' => 'Juanda', 'kota' => 'Surabaya', 'negara' => 'Indonesia'])->id;
        $this->gateId = Gate::create(['kode_gate' => $this->gateCode, 'nama_gate' => 'Gate ' . $this->gateCode, 'terminal' => 'T1'])->id;
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function makeFlight(string $nomor, string $jamJadwal, string $status = 'Scheduled', ?string $jamAktual = null): Flight
    {
        return Flight::create([
            'is_master'         => false,
            'tanggal_penerbangan' => $this->now->toDateString(),
            'nomor_penerbangan' => $nomor,
            'airline_id'        => $this->airlineId,
            'airport_asal_id'   => $this->asalId,
            'airport_tujuan_id' => $this->tujuanId,
            'jenis_penerbangan' => 'departure',
            'tipe_layanan'      => 'domestik',
            'jam_jadwal'        => $jamJadwal,
            'jam_aktual'        => $jamAktual,
            'status'            => $status,
            'gate_id'           => $this->gateId,
        ]);
    }

    private function gateFlights(): array
    {
        return $this->getJson("/api/fids/gate/{$this->gateCode}")
            ->assertOk()
            ->json('data.flights') ?? [];
    }

    public function test_flight_appears_only_within_one_hour_before_schedule(): void
    {
        // 10:30 → jendela buka 09:30, sekarang 10:00 → tampil.
        $this->makeFlight('IU100', '10:30:00');
        // 12:30 → jendela buka 11:30, sekarang 10:00 → belum tampil.
        $this->makeFlight('IU200', '12:30:00');

        $flights = $this->gateFlights();

        $this->assertCount(1, $flights);
        $this->assertSame('IU100', $flights[0]['nomor_penerbangan']);
    }

    public function test_flight_more_than_one_hour_before_is_hidden(): void
    {
        $this->makeFlight('IU300', '11:30:00'); // jendela buka 10:30 > sekarang 10:00
        $this->assertCount(0, $this->gateFlights());
    }

    public function test_departed_flight_lingers_5_minutes_then_hidden(): void
    {
        // Berangkat 09:57 (3 menit lalu) → masih tampil.
        $this->makeFlight('IU400', '09:00:00', 'Departed', '09:57:00');
        $this->assertCount(1, $this->gateFlights());
        $this->assertSame('IU400', $this->gateFlights()[0]['nomor_penerbangan']);
    }

    public function test_departed_flight_beyond_5_minutes_is_hidden(): void
    {
        // Berangkat 09:50 (10 menit lalu) → sudah hilang.
        $this->makeFlight('IU500', '09:00:00', 'Departed', '09:50:00');
        $this->assertCount(0, $this->gateFlights());
    }

    public function test_only_earliest_flight_occupies_the_gate(): void
    {
        $this->makeFlight('IU610', '10:45:00'); // jendela buka 09:45 → eligible
        $this->makeFlight('IU600', '10:15:00'); // jendela buka 09:15 → eligible & lebih awal

        $flights = $this->gateFlights();

        $this->assertCount(1, $flights);
        $this->assertSame('IU600', $flights[0]['nomor_penerbangan']);
    }
}
