<?php

namespace Tests\Feature;

use App\Models\BaggageClaim;
use App\Models\CheckinCounter;
use App\Models\Flight;
use App\Models\Gate;
use App\Models\Remark;
use App\Support\FlightStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

/**
 * `deploy.sh` menjalankan `php artisan db:seed --force` pada SETIAP deploy,
 * termasuk ke database produksi yang sudah berisi data operasional. Berkas ini
 * mengunci dua hal yang pernah membuat deploy gagal di tengah jalan:
 *
 *  1. db:seed tidak boleh menulis data operasional (gate, counter, belt,
 *     penerbangan) — hanya role & permission.
 *  2. MasterDataSeeder tidak boleh melanggar foreign key pada database yang
 *     id gate/counter/belt-nya tidak lagi dimulai dari 1.
 */
class DeploySeedSafetyTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Tirukan database produksi: gate sudah diganti nama oleh operator, dan
     * id-nya tidak lagi dimulai dari 1 karena gate bawaan pernah dihapus.
     */
    private function seedProductionLikeGates(): void
    {
        foreach (['A1', 'A2', 'A3', 'B1'] as $kode) {
            Gate::create(['kode_gate' => $kode, 'nama_gate' => "Gate {$kode}", 'terminal' => 'Domestik']);
        }

        Gate::where('kode_gate', 'A1')->firstOrFail()->update(['nama_gate' => 'Gate A1']);
    }

    public function test_deploy_seed_does_not_touch_operational_data(): void
    {
        $this->seedProductionLikeGates();

        Artisan::call('db:seed', ['--force' => true]);

        // Gate palsu G1-G4 tidak boleh ikut terpasang di samping gate asli.
        $this->assertSame(0, Gate::whereIn('kode_gate', ['G1', 'G2', 'G3', 'G4'])->count());
        $this->assertSame(4, Gate::count());

        // Begitu pula counter, belt, dan penerbangan dummy.
        $this->assertSame(0, CheckinCounter::count());
        $this->assertSame(0, BaggageClaim::count());
        $this->assertSame(0, Flight::count());
    }

    public function test_deploy_seed_still_installs_roles_and_permissions(): void
    {
        Artisan::call('db:seed', ['--force' => true]);

        // Alasan db:seed tetap dijalankan tiap deploy: permission bisa bertambah
        // antar rilis, jadi keduanya harus benar-benar terpasang.
        $this->assertGreaterThan(0, \Spatie\Permission\Models\Role::count());
        $this->assertGreaterThan(0, \Spatie\Permission\Models\Permission::count());
    }

    public function test_master_data_seeder_survives_non_sequential_ids(): void
    {
        // Inilah kasus yang dulu menghentikan deploy: penerbangan dummy menulis
        // 'gate_id' => 1 secara hardcode, sedangkan gate id 1 sudah tidak ada.
        $this->seedProductionLikeGates();

        Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\MasterDataSeeder', '--force' => true]);

        $dummy = Flight::where('nomor_penerbangan', 'ID-6257')->firstOrFail();

        // Rujukannya harus menunjuk gate yang benar-benar ada.
        $this->assertNotNull($dummy->gate_id);
        $this->assertNotNull(Gate::find($dummy->gate_id));
        $this->assertSame('G1', Gate::find($dummy->gate_id)->kode_gate);
    }

    /**
     * Status penerbangan inti harus selalu tersedia sebagai remark setelah deploy,
     * walau remark-nya sempat terhapus langsung dari database produksi.
     */
    public function test_deploy_seed_restores_missing_flight_status_remarks(): void
    {
        Remark::where('nama_remark', 'Boarding')->delete();
        Remark::where('nama_remark', 'Gate Closed')->update(['status_aktif' => false]);
        Remark::where('nama_remark', 'Scheduled')->update(['status_aktif' => false]);
        Remark::create(['kode' => 'DIV', 'nama_remark' => 'Diverted', 'status_aktif' => false]);

        $this->assertSame(1, Artisan::call('fids:check-flight-status-remarks'));

        Artisan::call('db:seed', ['--force' => true]);
        Artisan::call('db:seed', ['--force' => true]); // idempotent: tidak menggandakan

        $this->assertSame(0, Artisan::call('fids:check-flight-status-remarks'));
        $this->assertSame(count(FlightStatus::ALL), Remark::where('is_system', true)->count());
        $this->assertTrue(Remark::where('nama_remark', 'Boarding')->value('status_aktif'));
        // Pilihan operator dihormati, kecuali Scheduled yang wajib aktif.
        $this->assertFalse(Remark::where('nama_remark', 'Gate Closed')->value('status_aktif'));
        $this->assertTrue(Remark::where('nama_remark', 'Scheduled')->value('status_aktif'));
        // Remark buatan operator tidak disentuh.
        $this->assertFalse(Remark::where('nama_remark', 'Diverted')->value('status_aktif'));
        $this->assertFalse(Remark::where('nama_remark', 'Diverted')->value('is_system'));
    }

    /** Remark lama bernama sama (beda huruf) diambil alih, bukan digandakan. */
    public function test_flight_status_seeder_adopts_legacy_remark_names(): void
    {
        Remark::where('nama_remark', 'Delayed')->delete();
        $legacy = Remark::create(['kode' => 'DLY', 'nama_remark' => 'DELAYED', 'status_aktif' => false]);

        Artisan::call('db:seed', ['--class' => 'Database\Seeders\FlightStatusRemarkSeeder', '--force' => true]);

        $legacy->refresh();
        $this->assertSame('Delayed', $legacy->nama_remark);
        $this->assertTrue($legacy->is_system);
        $this->assertTrue($legacy->status_aktif);
        $this->assertSame(1, Remark::whereRaw('LOWER(nama_remark) = ?', ['delayed'])->count());
    }
}
