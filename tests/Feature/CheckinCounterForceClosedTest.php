<?php

namespace Tests\Feature;

use App\Models\Airline;
use App\Models\Airport;
use App\Models\CheckinCounter;
use App\Models\Flight;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Regresi tombol Buka/Tutup di kartu check-in counter.
 *
 * Tombol itu dulu mengubah status_counter, kolom yang sengaja diabaikan layar,
 * sehingga menekannya tidak berpengaruh apa pun di TV counter. Kendalinya kini
 * kolom dipaksa_tutup dan harus menang atas jadwal check-in.
 */
class CheckinCounterForceClosedTest extends TestCase
{
    use RefreshDatabase;

    private int $counterId;

    private string $counterNo = '02';

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-08-25 10:00:00'));

        $airlineId = Airline::create(['kode_maskapai' => 'QG', 'nama_maskapai' => 'Citilink'])->id;
        $asalId = Airport::create(['kode_iata' => 'AAP', 'nama_bandara' => 'APT Pranoto', 'kota' => 'Samarinda', 'negara' => 'Indonesia'])->id;
        $tujuanId = Airport::create(['kode_iata' => 'SUB', 'nama_bandara' => 'Juanda', 'kota' => 'Surabaya', 'negara' => 'Indonesia'])->id;
        $this->counterId = CheckinCounter::create(['nomor_counter' => $this->counterNo, 'terminal' => 'Domestik'])->id;

        $flight = Flight::create([
            'is_master' => false,
            'tanggal_penerbangan' => Carbon::now()->toDateString(),
            'nomor_penerbangan' => 'QG461',
            'airline_id' => $airlineId,
            'airport_asal_id' => $asalId,
            'airport_tujuan_id' => $tujuanId,
            'jenis_penerbangan' => 'departure',
            'tipe_layanan' => 'domestik',
            'jam_jadwal' => '11:05:00',
            'status' => 'Check-in Open',
        ]);
        $flight->checkinCounters()->attach($this->counterId);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function admin(): User
    {
        Role::findOrCreate('Super Admin');
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole('Super Admin');

        return $user;
    }

    private function layarTunggal(): array
    {
        return $this->getJson("/api/fids/checkin/{$this->counterNo}")->assertOk()->json('data');
    }

    private function layarGabungan(): array
    {
        $counters = $this->getJson('/api/fids/checkin-counters')->assertOk()->json('data');

        return collect($counters)->firstWhere('nomor_counter', $this->counterNo);
    }

    /** Baseline: tanpa penutupan paksa, penerbangan open check-in tetap tampil. */
    public function test_tanpa_penutupan_paksa_layar_tetap_buka(): void
    {
        $data = $this->layarTunggal();

        $this->assertSame('buka', $data['status_counter']);
        $this->assertCount(1, $data['flights']);
    }

    /** status_counter TIDAK boleh jadi kendali: default-nya 'tutup' di semua counter lama. */
    public function test_status_counter_tutup_tidak_memadamkan_layar(): void
    {
        CheckinCounter::find($this->counterId)->update(['status_counter' => 'tutup']);

        $this->assertSame('buka', $this->layarTunggal()['status_counter']);
    }

    public function test_dipaksa_tutup_menutup_layar_tunggal_walau_checkin_open(): void
    {
        CheckinCounter::find($this->counterId)->update(['dipaksa_tutup' => true]);

        $data = $this->layarTunggal();

        $this->assertSame('tutup', $data['status_counter']);
        // Occupant ikut kosong: layar tunggal memakai flights[0] untuk warna
        // maskapai dan strip bawah, jadi sisa data akan tetap terlihat.
        $this->assertCount(0, $data['flights']);
    }

    public function test_dipaksa_tutup_menutup_layar_gabungan(): void
    {
        CheckinCounter::find($this->counterId)->update(['dipaksa_tutup' => true]);

        $data = $this->layarGabungan();

        $this->assertSame('tutup', $data['status_counter']);
        $this->assertCount(0, $data['flights']);
    }

    /** Tombol di kartu admin benar-benar sampai ke layar, lalu bisa dibuka lagi. */
    public function test_tombol_admin_menutup_lalu_membuka_layar(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->post(route('admin.checkin-counters.toggle-tutup', $this->counterId))
            ->assertRedirect();

        $this->assertTrue(CheckinCounter::find($this->counterId)->dipaksa_tutup);
        Cache::flush();
        $this->assertSame('tutup', $this->layarTunggal()['status_counter']);

        $this->actingAs($admin)
            ->post(route('admin.checkin-counters.toggle-tutup', $this->counterId))
            ->assertRedirect();

        $this->assertFalse(CheckinCounter::find($this->counterId)->dipaksa_tutup);
        Cache::flush();
        $this->assertSame('buka', $this->layarTunggal()['status_counter']);
    }
}
