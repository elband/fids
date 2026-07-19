<?php

namespace Tests\Feature;

use App\Models\Airline;
use App\Models\Airport;
use App\Models\BaggageClaim;
use App\Models\CctvCamera;
use App\Models\Flight;
use App\Support\DisplayTimezone;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regresi aturan Baggage Claim:
 *  - Tampil hanya bila status penerbangan "sudah tiba".
 *  - Hilang setelah jendela waktu (durasi status di Pengaturan Layar FIDS).
 *  - Sertakan arrived_at + kamera CCTV belt untuk logika timeline frontend.
 */
class BaggageClaimRuleTest extends TestCase
{
    use RefreshDatabase;

    private string $tz;
    private Carbon $now;
    private int $airlineId;
    private int $asalId;
    private int $tujuanId;
    private int $beltId;
    private string $beltNo = 'B1';

    protected function setUp(): void
    {
        parent::setUp();
        $this->tz = DisplayTimezone::get();
        $this->now = Carbon::parse('2026-07-19 10:00:00', $this->tz);
        Carbon::setTestNow($this->now);

        $this->airlineId = Airline::create(['kode_maskapai' => 'IU', 'nama_maskapai' => 'Super Air Jet'])->id;
        $this->asalId = Airport::create(['kode_iata' => 'SUB', 'nama_bandara' => 'Juanda', 'kota' => 'Surabaya', 'negara' => 'Indonesia'])->id;
        $this->tujuanId = Airport::create(['kode_iata' => 'AAP', 'nama_bandara' => 'APT Pranoto', 'kota' => 'Samarinda', 'negara' => 'Indonesia'])->id;
        $this->beltId = BaggageClaim::create(['nomor_belt' => $this->beltNo, 'terminal' => 'T1', 'status_belt' => 'aktif'])->id;
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function makeFlight(string $nomor, string $status, ?string $jamAktual): Flight
    {
        return Flight::create([
            'is_master'         => false,
            'tanggal_penerbangan' => $this->now->toDateString(),
            'nomor_penerbangan' => $nomor,
            'airline_id'        => $this->airlineId,
            'airport_asal_id'   => $this->asalId,
            'airport_tujuan_id' => $this->tujuanId,
            'jenis_penerbangan' => 'arrival',
            'tipe_layanan'      => 'domestik',
            'jam_jadwal'        => '09:30:00',
            'jam_aktual'        => $jamAktual,
            'status'            => $status,
            'baggage_claim_id'  => $this->beltId,
        ]);
    }

    private function beltData(): array
    {
        return $this->getJson("/api/fids/baggage/{$this->beltNo}")->assertOk()->json('data');
    }

    public function test_shows_arrived_flight_with_arrived_at(): void
    {
        $this->makeFlight('IU652', 'Arrived', '09:55:00'); // tiba 5 menit lalu

        $data = $this->beltData();

        $this->assertCount(1, $data['flights']);
        $this->assertSame('IU652', $data['flights'][0]['nomor_penerbangan']);
        $this->assertNotEmpty($data['flights'][0]['arrived_at']);
    }

    public function test_hides_flight_not_arrived(): void
    {
        $this->makeFlight('IU652', 'Scheduled', null);
        $this->assertCount(0, $this->beltData()['flights']);
    }

    public function test_hides_on_time_flight_not_yet_landed(): void
    {
        // "On Time" = pra-kedatangan, pesawat belum mendarat → belt tidak boleh menampilkannya.
        $this->makeFlight('IU652', 'On Time', null);
        $this->assertCount(0, $this->beltData()['flights']);
    }

    public function test_hides_flight_after_window(): void
    {
        // Tiba 40 menit lalu > jendela max(durasi status 30, kamera selesai 20).
        $this->makeFlight('IU652', 'Arrived', '09:20:00');
        $this->assertCount(0, $this->beltData()['flights']);
    }

    public function test_returns_linked_cctv_camera(): void
    {
        $this->makeFlight('IU652', 'Arrived', '09:55:00');
        CctvCamera::create([
            'nama'         => 'Belt 1 Cam',
            'grup'         => 'baggage',
            'jenis_stream' => 'iframe',
            'url_stream'   => 'http://cam.local/belt1',
            'aktif'        => true,
            'baggage_claim_id' => $this->beltId,
        ]);

        $data = $this->beltData();

        $this->assertNotNull($data['camera']);
        $this->assertSame('http://cam.local/belt1', $data['camera']['url_stream']);
    }
}
