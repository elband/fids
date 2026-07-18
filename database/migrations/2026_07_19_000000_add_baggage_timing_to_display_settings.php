<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            // Berapa menit teks status penerbangan tetap tampil di baggage claim
            // setelah pesawat tiba.
            $table->unsignedSmallInteger('bagasi_durasi_status_menit')->default(30)->after('timezone');
            // Menit ke berapa (sejak tiba) kamera CCTV belt mulai tampil sebagai latar.
            $table->unsignedSmallInteger('bagasi_kamera_mulai_menit')->default(10)->after('bagasi_durasi_status_menit');
            // Menit ke berapa (sejak tiba) kamera CCTV belt berhenti tampil.
            $table->unsignedSmallInteger('bagasi_kamera_selesai_menit')->default(20)->after('bagasi_kamera_mulai_menit');
        });
    }

    public function down(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            $table->dropColumn([
                'bagasi_durasi_status_menit',
                'bagasi_kamera_mulai_menit',
                'bagasi_kamera_selesai_menit',
            ]);
        });
    }
};
