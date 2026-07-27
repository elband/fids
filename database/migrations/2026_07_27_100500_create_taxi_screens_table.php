<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('taxi_screens', function (Blueprint $table) {
            $table->id();
            $table->string('kode')->unique();     // dikirim layar via ?screen=terminal-a
            $table->string('nama')->nullable();
            $table->string('lokasi')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('resolusi', 20)->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->index('last_seen_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('taxi_screens');
    }
};
