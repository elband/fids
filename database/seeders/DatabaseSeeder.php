<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seeder yang dijalankan `php artisan db:seed` — dipanggil deploy.sh pada
     * SETIAP deploy, jadi isinya harus aman untuk database produksi yang sudah
     * berisi data operasional.
     *
     * Hanya role & permission: keduanya idempotent penuh dan memang perlu jalan
     * tiap deploy karena permission bisa bertambah antar rilis.
     *
     * MasterDataSeeder sengaja TIDAK di sini. Isinya data contoh untuk instalasi
     * baru (bandara, maskapai, gate G1-G4, counter, belt, penerbangan dummy),
     * sedangkan di produksi semua itu sudah dikelola operator lewat panel admin.
     * Menjalankannya tiap deploy berarti menulis ulang data operasional: gate
     * yang sudah diganti nama menjadi A1/A2/B1 akan ditemani gate palsu G1-G4,
     * dan penerbangan dummy muncul di layar publik sebagai penerbangan sungguhan.
     *
     * Untuk instalasi baru, panggil eksplisit:
     *   php artisan db:seed --class=MasterDataSeeder
     */
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            TaxiPermissionSeeder::class,
        ]);
    }
}
