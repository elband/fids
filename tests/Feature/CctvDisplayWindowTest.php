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
 * Regresi jendela tampil layar CCTV.
 *
 * Pemicunya penerbangan arrival hari ini di belt yang ditautkan ke kamera,
 * berstatus "sudah tiba". Berapa lama kamera tampil ditentukan per kamera
 * lewat tampil_mulai_menit / tampil_selesai_menit, dihitung sejak pesawat tiba.
 */
class CctvDisplayWindowTest extends TestCase
{
    use RefreshDatabase;

    private Carbon $now;
    private int $airlineId;
    private int $asalId;
    private int $tujuanId;
    private int $beltId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->now = Carbon::parse('2026-07-19 10:00:00', DisplayTimezone::get());
        Carbon::setTestNow($this->now);

        $this->airlineId = Airline::create(['kode_maskapai' => 'IU', 'nama_maskapai' => 'Super Air Jet'])->id;
        $this->asalId = Airport::create(['kode_iata' => 'SUB', 'nama_bandara' => 'Juanda', 'kota' => 'Surabaya', 'negara' => 'Indonesia'])->id;
        $this->tujuanId = Airport::create(['kode_iata' => 'AAP', 'nama_bandara' => 'APT Pranoto', 'kota' => 'Samarinda', 'negara' => 'Indonesia'])->id;
        $this->beltId = BaggageClaim::create(['nomor_belt' => 'B1', 'terminal' => 'T1', 'status_belt' => 'aktif'])->id;
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    /** @param string|null $jamAktual jam tiba (ATA) dalam zona tampilan */
    private function makeFlight(string $status, ?string $jamAktual): Flight
    {
        return Flight::create([
            'is_master'           => false,
            'tanggal_penerbangan' => $this->now->toDateString(),
            'nomor_penerbangan'   => 'IU652',
            'airline_id'          => $this->airlineId,
            'airport_asal_id'     => $this->asalId,
            'airport_tujuan_id'   => $this->tujuanId,
            'jenis_penerbangan'   => 'arrival',
            'tipe_layanan'        => 'domestik',
            'jam_jadwal'          => '09:30:00',
            'jam_aktual'          => $jamAktual,
            'status'              => $status,
            'baggage_claim_id'    => $this->beltId,
        ]);
    }

    private function makeCamera(int $mulai = 0, ?int $selesai = null, ?int $beltId = null): CctvCamera
    {
        return CctvCamera::create([
            'nama'                 => 'Belt 1 Cam',
            'grup'                 => 'baggage',
            'jenis_stream'         => 'iframe',
            'url_stream'           => 'http://cam.local/belt1',
            'aktif'                => true,
            'baggage_claim_id'     => $beltId ?? $this->beltId,
            'tampil_mulai_menit'   => $mulai,
            'tampil_selesai_menit' => $selesai,
        ]);
    }

    /** is_active kamera pertama pada layar CCTV multi-kamera. */
    private function firstCameraIsActive(): bool
    {
        $props = $this->get('/public/cctv/baggage')->assertOk()->viewData('page')['props'];

        return (bool) $props['cameras'][0]['is_active'];
    }

    public function test_camera_is_live_inside_window(): void
    {
        $this->makeFlight('Arrived', '09:55:00'); // tiba 5 menit lalu
        $this->makeCamera(0, 45);

        $this->assertTrue($this->firstCameraIsActive());
    }

    public function test_camera_is_dark_before_window_starts(): void
    {
        $this->makeFlight('Arrived', '09:55:00'); // tiba 5 menit lalu
        $this->makeCamera(10, 45);                // baru menyala menit ke-10

        $this->assertFalse($this->firstCameraIsActive());
    }

    public function test_camera_is_dark_after_window_ends(): void
    {
        $this->makeFlight('Arrived', '09:00:00'); // tiba 60 menit lalu
        $this->makeCamera(0, 45);

        $this->assertFalse($this->firstCameraIsActive());
    }

    public function test_null_end_means_no_time_limit(): void
    {
        // Perilaku sebelum jendela ini ada, dan default kamera lama saat migrasi:
        // kamera ikut umur status penerbangan, tanpa batas waktu.
        $this->makeFlight('Arrived', '05:00:00'); // tiba 5 jam lalu
        $this->makeCamera(0, null);

        $this->assertTrue($this->firstCameraIsActive());
    }

    public function test_flight_not_arrived_never_triggers_camera(): void
    {
        // Jendela terbuka penuh pun tidak boleh menyalakan kamera bila pesawat
        // belum mendarat — pemicunya tetap status penerbangan.
        $this->makeFlight('Scheduled', null);
        $this->makeCamera(0, null);

        $this->assertFalse($this->firstCameraIsActive());
    }

    public function test_without_ata_window_is_measured_from_status_change(): void
    {
        // Tanpa ATA, patokan jendela adalah updated_at — saat operator mengubah
        // status. Penerbangan yang baru saja diubah statusnya berarti elapsed 0.
        $flight = $this->makeFlight('Baggage Claim', null);
        $this->makeCamera(5, 45); // baru menyala menit ke-5

        $this->assertFalse($this->firstCameraIsActive(), 'baru ganti status: belum masuk jendela');

        // Enam menit kemudian kamera sudah masuk jendela.
        $flight->forceFill(['updated_at' => $this->now->copy()->subMinutes(6)])->saveQuietly();

        $this->assertTrue($this->firstCameraIsActive(), 'enam menit setelah ganti status: sudah tampil');
    }

    public function test_single_camera_page_uses_same_window(): void
    {
        $this->makeFlight('Arrived', '09:00:00'); // tiba 60 menit lalu, di luar jendela
        $cam = $this->makeCamera(0, 45);

        $props = $this->get("/public/cctv/baggage/details?id={$cam->id}")->assertOk()->viewData('page')['props'];

        $this->assertFalse((bool) $props['camera']['is_active']);
    }
}
