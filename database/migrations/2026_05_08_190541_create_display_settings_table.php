<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('display_settings', function (Blueprint $table) {
            $table->id();
            $table->string('nama_bandara')->default('Bandara APT Pranoto');
            $table->string('logo_bandara')->nullable();
            $table->string('tema_warna')->default('navy');
            $table->integer('interval_refresh')->default(10);
            $table->integer('kecepatan_running_text')->default(50);
            $table->boolean('tampilkan_cuaca')->default(true);
            $table->boolean('tampilkan_logo_maskapai')->default(true);
            $table->enum('mode_default', ['landscape', 'portrait'])->default('landscape');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('display_settings');
    }
};
