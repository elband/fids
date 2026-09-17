<?php

use Database\Seeders\FlightStatusRemarkSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Menjadikan tabel `remarks` sumber daftar status penerbangan.
 *
 * Setiap status di FlightStatus::ALL wajib ada sebagai remark `is_system` dengan
 * `nama_remark` persis sama, karena layar publik mencocokkan status berdasarkan teks.
 * Isinya dipasang oleh FlightStatusRemarkSeeder, yang juga dijalankan deploy.sh pada
 * setiap deploy agar status inti yang hilang atau baru selalu dipulihkan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('remarks', function (Blueprint $table) {
            $table->boolean('is_system')->default(false)->after('status_aktif');
        });

        (new FlightStatusRemarkSeeder())->run();
    }

    public function down(): void
    {
        Schema::table('remarks', function (Blueprint $table) {
            $table->dropColumn('is_system');
        });
    }
};
