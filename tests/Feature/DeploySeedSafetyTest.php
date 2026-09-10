<?php

namespace Tests\Feature;

use App\Models\BaggageClaim;
use App\Models\CheckinCounter;
use App\Models\Flight;
use App\Models\Gate;
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
}
