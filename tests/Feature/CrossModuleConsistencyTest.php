<?php

namespace Tests\Feature;

use App\Models\Airline;
use App\Models\Airport;
use App\Models\BaggageClaim;
use App\Models\CheckinCounter;
use App\Models\Flight;
use App\Models\FlightStatusLog;
use App\Models\Gate;
use App\Models\User;
use App\Support\DisplayTimezone;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Regresi konsistensi antar-modul: modul Penerbangan (master/harian) sebagai sumber
 * data versus modul Boarding Gate, Check-in Counter, Baggage Claim, dan API layar.
 *
 * Setiap tes di sini mengunci satu bug yang pernah membuat kedua sisi tidak sepakat.
 */
class CrossModuleConsistencyTest extends TestCase
{
    use RefreshDatabase;

    private Carbon $now;
    private int $airlineId;
    private int $asalId;
    private int $tujuanId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->now = Carbon::parse('2026-07-19 10:00:00', DisplayTimezone::get());
        Carbon::setTestNow($this->now);

        $this->airlineId = Airline::create(['kode_maskapai' => 'IU', 'nama_maskapai' => 'Super Air Jet'])->id;
        $this->asalId = Airport::create(['kode_iata' => 'AAP', 'nama_bandara' => 'APT Pranoto', 'kota' => 'Samarinda', 'negara' => 'Indonesia'])->id;
        $this->tujuanId = Airport::create(['kode_iata' => 'SUB', 'nama_bandara' => 'Juanda', 'kota' => 'Surabaya', 'negara' => 'Indonesia'])->id;

        Role::findOrCreate('Super Admin');
    }

    /** Petugas dengan hak penuh untuk menekan endpoint admin. */
    private function operator(): User
    {
        return User::factory()->create(['email_verified_at' => now()])->assignRole('Super Admin');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function makeFlight(array $overrides = []): Flight
    {
        return Flight::create(array_merge([
            'is_master'           => false,
            'tanggal_penerbangan' => $this->now->toDateString(),
            'nomor_penerbangan'   => 'IU641',
            'airline_id'          => $this->airlineId,
            'airport_asal_id'     => $this->asalId,
            'airport_tujuan_id'   => $this->tujuanId,
            'jenis_penerbangan'   => 'departure',
            'tipe_layanan'        => 'domestik',
            'jam_jadwal'          => '10:30:00',
            'status'              => 'Scheduled',
        ], $overrides));
    }

    /**
     * Status 'On Time' dan 'Check-in Closed' ada di dropdown petugas tetapi dulu
     * tertinggal dari whereIn kueri gate, sehingga penerbangan LENYAP dari layar gate
     * begitu petugas memilih salah satunya, lalu muncul lagi di 'Boarding'.
     */
    public function test_gate_board_keeps_flight_on_every_selectable_departure_status(): void
    {
        $gate = Gate::create(['kode_gate' => 'G9', 'nama_gate' => 'Gate G9', 'terminal' => 'T1']);
        $flight = $this->makeFlight(['gate_id' => $gate->id]);

        foreach (['On Time', 'Check-in Open', 'Check-in Closed', 'Boarding', 'Gate Open', 'Final Call', 'Gate Closed'] as $status) {
            $flight->update(['status' => $status]);
            Cache::flush();

            $single = $this->getJson('/api/fids/gate/G9')->assertOk()->json('data.flights');
            $this->assertCount(1, $single, "Status '{$status}' hilang dari layar gate tunggal.");

            $board = collect($this->getJson('/api/fids/gates')->assertOk()->json('data'))
                ->firstWhere('kode_gate', 'G9');
            $this->assertCount(1, $board['flights'], "Status '{$status}' hilang dari papan gate.");
        }
    }

    /** Endpoint gate tunggal harus memfilter jenis penerbangan sama seperti papan gate. */
    public function test_gate_endpoints_ignore_arrival_flights(): void
    {
        $gate = Gate::create(['kode_gate' => 'G9', 'nama_gate' => 'Gate G9', 'terminal' => 'T1']);
        $this->makeFlight([
            'gate_id'           => $gate->id,
            'jenis_penerbangan' => 'arrival',
            'status'            => 'Check-in Open',
        ]);

        $this->assertCount(0, $this->getJson('/api/fids/gate/G9')->assertOk()->json('data.flights'));

        $board = collect($this->getJson('/api/fids/gates')->assertOk()->json('data'))
            ->firstWhere('kode_gate', 'G9');
        $this->assertCount(0, $board['flights']);
    }

    /** Endpoint belt tunggal harus memfilter jenis penerbangan sama seperti papan bagasi. */
    public function test_baggage_endpoint_ignores_departure_flights(): void
    {
        $belt = BaggageClaim::create(['nomor_belt' => '3', 'terminal' => 'T1', 'status_belt' => 'aktif']);
        $this->makeFlight([
            'baggage_claim_id'  => $belt->id,
            'jenis_penerbangan' => 'departure',
            'status'            => 'Arrived',
            'jam_aktual'        => '09:50:00',
        ]);

        $this->assertCount(0, $this->getJson('/api/fids/baggage/3')->assertOk()->json('data.flights'));
    }

    /**
     * Penugasan counter dari modul Keberangkatan (pivot) harus terlihat oleh modul
     * Check-in Counter dan KPI Dashboard yang membaca kolom warisan checkin_counter_id.
     */
    public function test_assigning_counter_via_pivot_also_fills_legacy_column(): void
    {
        $counter = CheckinCounter::create(['nomor_counter' => '14', 'terminal' => 'T1']);
        $flight = $this->makeFlight();

        app(\App\Services\FlightService::class)->syncCounters($flight, [$counter->id]);

        $this->assertSame($counter->id, $flight->fresh()->checkin_counter_id);
    }

    /** Counter utama = nomor terkecil secara numerik (2 sebelum 10, bukan alfabetis). */
    public function test_primary_counter_column_uses_numeric_order(): void
    {
        $c10 = CheckinCounter::create(['nomor_counter' => '10', 'terminal' => 'T1']);
        $c2 = CheckinCounter::create(['nomor_counter' => '2', 'terminal' => 'T1']);
        $flight = $this->makeFlight();

        app(\App\Services\FlightService::class)->syncCounters($flight, [$c10->id, $c2->id]);

        $this->assertSame($c2->id, $flight->fresh()->checkin_counter_id);
    }

    /**
     * Penugasan dari modul Check-in Counter harus mengisi pivot, karena pivot-lah
     * yang dibaca layar counter publik. Dulu hanya kolom yang terisi sehingga layar
     * counter tetap "TUTUP" walau petugas sudah menugaskan penerbangan.
     */
    public function test_assigning_from_counter_module_makes_flight_visible_on_display(): void
    {
        $counter = CheckinCounter::create(['nomor_counter' => '14', 'terminal' => 'T1']);
        $flight = $this->makeFlight();

        $this->actingAs($this->operator())
            ->put(route('admin.checkin-counters.update', $counter), [
                'nomor_counter'  => '14',
                'terminal'       => 'T1',
                'status_counter' => 'buka',
                'flight_id'      => $flight->id,
            ])->assertRedirect();

        $this->assertTrue($flight->fresh()->checkinCounters->contains($counter->id));

        $data = $this->getJson('/api/fids/checkin/14')->assertOk()->json('data');
        $this->assertSame('buka', $data['status_counter']);
        $this->assertCount(1, $data['flights']);
    }

    /** Melepas penerbangan dari counter harus membersihkan pivot, bukan hanya kolom. */
    public function test_removing_flight_from_counter_module_clears_pivot(): void
    {
        $counter = CheckinCounter::create(['nomor_counter' => '14', 'terminal' => 'T1']);
        $flight = $this->makeFlight(['status' => 'Check-in Open']);
        $flight->checkinCounters()->attach($counter->id);

        $this->actingAs($this->operator())
            ->post(route('admin.checkin-counters.remove-flight', [$counter, $flight]))
            ->assertRedirect();

        $this->assertFalse($flight->fresh()->checkinCounters->contains($counter->id));
        $this->assertNull($flight->fresh()->checkin_counter_id);
        $this->assertCount(0, $this->getJson('/api/fids/checkin/14')->assertOk()->json('data.flights'));
    }

    /**
     * Perubahan status dari modul Gate/Counter/Baggage dulu memakai update langsung,
     * sehingga tidak tercatat di FlightStatusLog — hilang dari Laporan & log Dashboard.
     */
    public function test_status_change_from_gate_module_is_logged(): void
    {
        $gate = Gate::create(['kode_gate' => 'G9', 'nama_gate' => 'Gate G9', 'terminal' => 'T1']);
        $flight = $this->makeFlight(['status' => 'Check-in Open']);

        $this->actingAs($this->operator())
            ->put(route('admin.gates.update', $gate), [
                'kode_gate'   => 'G9',
                'nama_gate'   => 'Gate G9',
                'terminal'    => 'T1',
                'status_gate' => 'aktif',
                'flight_id'   => $flight->id,
            ])->assertRedirect();

        $this->assertSame('Gate Open', $flight->fresh()->status);
        $this->assertDatabaseHas('flight_status_logs', [
            'flight_id'    => $flight->id,
            'status_lama'  => 'Check-in Open',
            'status_baru'  => 'Gate Open',
        ]);
    }

    /** Pengumuman kedatangan harus berbunyi "from", bukan "to". */
    public function test_arrival_announcement_uses_from_in_english(): void
    {
        $flight = $this->makeFlight([
            'jenis_penerbangan' => 'arrival',
            'status'            => 'Scheduled',
        ]);

        app(\App\Services\FlightService::class)->updateStatus($flight, 'Landed');

        $isi = \App\Models\Announcement::latest('id')->first()->isi_pengumuman;
        $this->assertStringContainsString('from Samarinda', $isi);
        $this->assertStringNotContainsString('to Samarinda', $isi);
    }

    /** Modul Penerbangan harus bisa menyunting master template (tanggal null). */
    public function test_flights_module_can_update_master_template(): void
    {
        $master = $this->makeFlight([
            'is_master'           => true,
            'tanggal_penerbangan' => null,
            'hari_operasi'        => ['Senin'],
        ]);

        $this->actingAs($this->operator())
            ->put(route('admin.flights.update', $master), [
                'tanggal_penerbangan' => null,
                'nomor_penerbangan'   => 'IU642',
                'airline_id'          => $this->airlineId,
                'airport_asal_id'     => $this->asalId,
                'airport_tujuan_id'   => $this->tujuanId,
                'jam_jadwal'          => '11:00:00',
                'jenis_penerbangan'   => 'departure',
                'tipe_layanan'        => 'domestik',
                'status'              => 'Scheduled',
            ])->assertSessionHasNoErrors()->assertRedirect();

        $this->assertSame('IU642', $master->fresh()->nomor_penerbangan);
    }

    /** Arsip harus menyimpan counter walau penugasannya hanya ada di pivot. */
    public function test_archive_keeps_counter_assigned_via_pivot(): void
    {
        $counter = CheckinCounter::create(['nomor_counter' => '14', 'terminal' => 'T1']);
        $flight = $this->makeFlight(['tanggal_penerbangan' => $this->now->copy()->subDays(5)->toDateString()]);
        // Sengaja hanya pivot (data lama sebelum kolom warisan ikut disinkronkan).
        $flight->checkinCounters()->attach($counter->id);

        $this->artisan('fids:archive-flights')->assertSuccessful();

        $this->assertDatabaseHas('archived_flights', [
            'original_flight_id' => $flight->id,
            'checkin_counter_id' => $counter->id,
        ]);
    }
}
