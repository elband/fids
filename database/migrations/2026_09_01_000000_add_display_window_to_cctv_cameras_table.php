<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cctv_cameras', function (Blueprint $table) {
            // Jendela tampil per kamera, dihitung dalam menit sejak pesawat tiba.
            // Sebelumnya kamera menyala selama status penerbangan masih "sudah
            // tiba" — tanpa batas waktu sama sekali, sehingga status yang lupa
            // diubah operator membuat kamera menyala sampai ganti hari.
            $table->unsignedSmallInteger('tampil_mulai_menit')
                ->default(0)
                ->after('urutan')
                ->comment('Menit ke berapa sejak tiba kamera mulai tampil');

            // NULL = tanpa batas akhir (perilaku lama). Dipakai sebagai default
            // agar kamera yang sudah ada tidak berubah perilakunya saat migrasi.
            $table->unsignedSmallInteger('tampil_selesai_menit')
                ->nullable()
                ->after('tampil_mulai_menit')
                ->comment('Menit ke berapa sejak tiba kamera berhenti tampil; NULL = ikut status penerbangan');
        });
    }

    public function down(): void
    {
        Schema::table('cctv_cameras', function (Blueprint $table) {
            $table->dropColumn(['tampil_mulai_menit', 'tampil_selesai_menit']);
        });
    }
};
