<?php

namespace Tests\Feature;

use App\Models\Airline;
use App\Models\Airport;
use App\Models\CheckinCounter;
use App\Models\Flight;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regresi aturan Check-in Counter:
 *  - Counter menampilkan data HANYA bila status penerbangan = "Check-in Open".
 *  - Satu counter dipakai satu penerbangan (jadwal paling awal).
 *  - status_counter untuk tampilan mengikuti ada/tidaknya penerbangan open check-in.
 */
class CheckinCounterRuleTest extends TestCase
{
    use RefreshDatabase;

    private int $airlineId;
    private int $asalId;
    private int $tujuanId;
    private int $counterId;
    private string $counterNo = '14';

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-07-19 10:00:00'));

        $this->airlineId = Airline::create(['kode_maskapai' => 'IU', 'nama_maskapai' => 'Super Air Jet'])->id;
        $this->asalId = Airport::create(['kode_iata' => 'AAP', 'nama_bandara' => 'APT Pranoto', 'kota' => 'Samarinda', 'negara' => 'Indonesia'])->id;
        $this->tujuanId = Airport::create(['kode_iata' => 'SUB', 'nama_bandara' => 'Juanda', 'kota' => 'Surabaya', 'negara' => 'Indonesia'])->id;
        $this->counterId = CheckinCounter::create(['nomor_counter' => $this->counterNo, 'terminal' => 'T1'])->id;
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function makeFlight(string $nomor, string $jamJadwal, string $status): Flight
    {
        $f = Flight::create([
            'is_master'         => false,
            'tanggal_penerbangan' => Carbon::now()->toDateString(),
            'nomor_penerbangan' => $nomor,
            'airline_id'        => $this->airlineId,
            'airport_asal_id'   => $this->asalId,
            'airport_tujuan_id' => $this->tujuanId,
            'jenis_penerbangan' => 'departure',
            'tipe_layanan'      => 'domestik',
            'jam_jadwal'        => $jamJadwal,
            'status'            => $status,
        ]);
        $f->checkinCounters()->attach($this->counterId);
        return $f;
    }

    private function getData(): array
    {
        return $this->getJson("/api/fids/checkin/{$this->counterNo}")
            ->assertOk()
            ->json('data');
    }

    public function test_shows_flight_only_when_checkin_open(): void
    {
        $this->makeFlight('IU641', '11:00:00', 'Check-in Open');

        $data = $this->getData();

        $this->assertSame('buka', $data['status_counter']);
        $this->assertCount(1, $data['flights']);
        $this->assertSame('IU641', $data['flights'][0]['nomor_penerbangan']);
    }

    public function test_hides_flight_when_not_checkin_open(): void
    {
        $this->makeFlight('IU641', '11:00:00', 'Scheduled');

        $data = $this->getData();

        $this->assertSame('tutup', $data['status_counter']);
        $this->assertCount(0, $data['flights']);
    }

    public function test_one_counter_one_flight_earliest_wins(): void
    {
        $this->makeFlight('IU900', '11:30:00', 'Check-in Open');
        $this->makeFlight('IU800', '10:45:00', 'Check-in Open'); // lebih awal

        $data = $this->getData();

        $this->assertCount(1, $data['flights']);
        $this->assertSame('IU800', $data['flights'][0]['nomor_penerbangan']);
    }
}
