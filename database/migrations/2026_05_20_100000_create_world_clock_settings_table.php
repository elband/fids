<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('world_clock_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('show_utc')->default(true);
            $table->boolean('show_wib')->default(true);
            $table->boolean('show_wita')->default(true);
            $table->boolean('show_wit')->default(true);
            $table->string('format_waktu')->default('24h')->comment('12h or 24h');
            $table->boolean('show_seconds')->default(true);
            $table->boolean('show_date')->default(true);
            $table->string('tema_warna')->default('#0f172a')->comment('Background color');
            $table->string('accent_color')->default('#3b82f6')->comment('Accent/highlight color');
            $table->string('judul_layar')->nullable()->comment('Custom title shown on display');
            $table->boolean('show_nama_bandara')->default(true);
            $table->boolean('show_analog_clock')->default(false);
            $table->boolean('show_ntp_status')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('world_clock_settings');
    }
};
