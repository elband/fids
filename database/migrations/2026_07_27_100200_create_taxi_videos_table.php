<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('taxi_videos', function (Blueprint $table) {
            $table->id();
            $table->string('judul');
            $table->string('file_path');
            $table->string('thumbnail_path')->nullable();
            $table->unsignedInteger('durasi_detik')->nullable();
            // Multi-playlist: 'all' selalu tayang, sisanya mengikuti jam operasional.
            $table->enum('playlist', ['all', 'pagi', 'siang', 'malam'])->default('all');
            // Batasi ke hari tertentu (0=Minggu..6=Sabtu). Null = semua hari.
            $table->json('hari')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('order_index')->default(0);
            // Statistik pemutaran (diakumulasi dari laporan layar).
            $table->unsignedBigInteger('play_count')->default(0);
            $table->unsignedBigInteger('total_play_seconds')->default(0);
            $table->timestamp('last_played_at')->nullable();
            $table->timestamps();

            $table->index(['is_active', 'playlist', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('taxi_videos');
    }
};
