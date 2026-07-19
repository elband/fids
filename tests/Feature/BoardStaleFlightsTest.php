<?php

namespace Tests\Feature;

use App\Models\Airline;
use App\Models\Airport;
use App\Models\Flight;
use App\Support\DisplayTimezone;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regresi: penerbangan yang sudah berangkat/tiba > 3 jam tidak lagi tampil
 * di papan keberangkatan/kedatangan.
 */
class BoardStaleFlightsTest extends TestCase
{
    use RefreshDatabase;

    private int $airlineId;
    private int $aapId;
    private int $subId;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-07-19 15:00:00', DisplayTimezone::get()));
        $this->airlineId = Airline::create(['kode_maskapai' => 'IU', 'nama_maskapai' => 'Super Air Jet'])->id;
        $this->aapId = Airport::create(['kode_iata' => 'AAP', 'nama_bandara' => 'APT Pranoto', 'kota' => 'Samarinda', 'negara' => 'Indonesia'])->id;
        $this->subId = Airport::create(['kode_iata' => 'SUB', 'nama_bandara' => 'Juanda', 'kota' => 'Surabaya', 'negara' => 'Indonesia'])->id;
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function make(string $jenis, string $nomor, string $jamJadwal, string $status, ?string $jamAktual): void
    {
        Flight::create([
            'is_master' => false,
            'tanggal_penerbangan' => Carbon::now()->toDateString(),
            'nomor_penerbangan' => $nomor,
            'airline_id' => $this->airlineId,
            'airport_asal_id' => $jenis === 'departure' ? $this->aapId : $this->subId,
            'airport_tujuan_id' => $jenis === 'departure' ? $this->subId : $this->aapId,
            'jenis_penerbangan' => $jenis,
            'tipe_layanan' => 'domestik',
            'jam_jadwal' => $jamJadwal,
            'jam_aktual' => $jamAktual,
            'status' => $status,
        ]);
    }

    public function test_departures_hide_departed_after_3_hours(): void
    {
        $this->make('departure', 'IU100', '11:00:00', 'Departed', '11:00:00'); // 4 jam lalu → hilang
        $this->make('departure', 'IU200', '13:00:00', 'Departed', '13:00:00'); // 2 jam lalu → tampil
        $this->make('departure', 'IU300', '16:00:00', 'Scheduled', null);      // belum → tampil

        $nomors = collect($this->getJson('/api/fids/departures')->assertOk()->json('data'))
            ->pluck('nomor_penerbangan')->all();

        $this->assertNotContains('IU100', $nomors);
        $this->assertContains('IU200', $nomors);
        $this->assertContains('IU300', $nomors);
    }

    public function test_arrivals_hide_arrived_after_3_hours(): void
    {
        $this->make('arrival', 'IU640', '11:00:00', 'Arrived', '11:00:00'); // 4 jam lalu → hilang
        $this->make('arrival', 'IU652', '14:00:00', 'Arrived', '14:00:00'); // 1 jam lalu → tampil

        $nomors = collect($this->getJson('/api/fids/arrivals')->assertOk()->json('data'))
            ->pluck('nomor_penerbangan')->all();

        $this->assertNotContains('IU640', $nomors);
        $this->assertContains('IU652', $nomors);
    }

    public function test_arrivals_keep_on_time_flight_even_if_edited_long_ago(): void
    {
        // "On Time" bukan status tiba → tidak boleh dianggap stale walau updated_at lama.
        $f = Flight::create([
            'is_master' => false,
            'tanggal_penerbangan' => Carbon::now()->toDateString(),
            'nomor_penerbangan' => 'IU700',
            'airline_id' => $this->airlineId,
            'airport_asal_id' => $this->subId,
            'airport_tujuan_id' => $this->aapId,
            'jenis_penerbangan' => 'arrival',
            'tipe_layanan' => 'domestik',
            'jam_jadwal' => '18:00:00', // masih akan tiba nanti sore
            'jam_aktual' => null,
            'status' => 'On Time',
        ]);
        // Paksa updated_at jauh di masa lalu (mensimulasikan diedit pagi hari).
        Flight::where('id', $f->id)->update(['updated_at' => Carbon::now()->subHours(6)]);

        $nomors = collect($this->getJson('/api/fids/arrivals')->assertOk()->json('data'))
            ->pluck('nomor_penerbangan')->all();

        $this->assertContains('IU700', $nomors);
    }

    public function test_hide_duration_configurable_via_setting(): void
    {
        // Durasi disetel 60 menit di Pengaturan Layar.
        \App\Models\DisplaySetting::create(['board_hide_after_menit' => 60]);

        // Berangkat 90 menit lalu (13:30, sekarang 15:00) → > 60 menit → hilang.
        $this->make('departure', 'IU900', '13:30:00', 'Departed', '13:30:00');
        // Berangkat 30 menit lalu (14:30) → < 60 menit → tetap tampil.
        $this->make('departure', 'IU901', '14:30:00', 'Departed', '14:30:00');

        $nomors = collect($this->getJson('/api/fids/departures')->assertOk()->json('data'))
            ->pluck('nomor_penerbangan')->all();

        $this->assertNotContains('IU900', $nomors);
        $this->assertContains('IU901', $nomors);
    }

    public function test_zero_disables_hiding(): void
    {
        // 0 = tidak pernah disembunyikan (tampil terus).
        \App\Models\DisplaySetting::create(['board_hide_after_menit' => 0]);

        // Berangkat 5 jam lalu tetap tampil.
        $this->make('departure', 'IU910', '10:00:00', 'Departed', '10:00:00');

        $nomors = collect($this->getJson('/api/fids/departures')->assertOk()->json('data'))
            ->pluck('nomor_penerbangan')->all();

        $this->assertContains('IU910', $nomors);
    }
}
