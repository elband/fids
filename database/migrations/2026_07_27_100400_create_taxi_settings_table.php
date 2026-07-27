<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('taxi_settings', function (Blueprint $table) {
            $table->id();
            $table->string('judul_layar')->default('TAXI INFORMATION');
            $table->string('logo_path')->nullable();
            $table->string('background_path')->nullable();
            $table->string('warna_aksen', 20)->default('#fbbf24');
            $table->string('tema_warna', 20)->default('slate'); // slate | midnight | teal | plum
            $table->unsignedInteger('video_interval_detik')->default(0);  // 0 = putar sampai video selesai
            $table->unsignedInteger('flight_refresh_detik')->default(15);
            $table->unsignedInteger('running_text_speed')->default(60);   // detik per satu putaran
            $table->unsignedInteger('fare_rotate_detik')->default(12);
            $table->enum('bahasa', ['id', 'en', 'auto'])->default('auto');
            $table->unsignedInteger('bahasa_switch_detik')->default(20);
            $table->boolean('tampilkan_penerbangan')->default(true);
            $table->boolean('tampilkan_video')->default(true);
            $table->boolean('tampilkan_tarif')->default(true);
            $table->boolean('mode_hemat')->default(false); // matikan animasi berat untuk Raspberry Pi
            // Emergency override — menggantikan seluruh konten layar sementara waktu.
            $table->boolean('emergency_active')->default(false);
            $table->string('emergency_judul')->nullable();
            $table->text('emergency_pesan')->nullable();
            $table->dateTime('emergency_sampai')->nullable();
            $table->timestamps();
        });

        // Singleton: satu baris pengaturan selalu tersedia.
        DB::table('taxi_settings')->insert([
            'judul_layar' => 'TAXI INFORMATION',
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('taxi_settings');
    }
};
