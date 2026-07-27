<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('taxi_counters', function (Blueprint $table) {
            $table->id();
            $table->string('nomor', 10);              // 01..08, ditampilkan besar di kartu
            $table->string('nama_operator');          // Bluebird, Express, Koperasi, dst.
            $table->string('jenis_layanan')->nullable(); // Reguler / Eksekutif / Online
            $table->string('arah', 4)->default('→');  // simbol panah pada kartu
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('order_index')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('taxi_counters');
    }
};
