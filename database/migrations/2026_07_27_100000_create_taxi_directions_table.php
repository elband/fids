<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('taxi_directions', function (Blueprint $table) {
            $table->id();
            $table->string('judul');
            $table->string('judul_en')->nullable();
            $table->text('deskripsi')->nullable();
            $table->text('deskripsi_en')->nullable();
            $table->string('gambar_path')->nullable();  // foto petunjuk arah
            $table->string('denah_path')->nullable();   // denah / peta sederhana
            $table->string('qr_path')->nullable();      // gambar QR yang diunggah operator
            $table->string('qr_url')->nullable();       // caption/tautan yang diwakili QR
            $table->unsignedInteger('jarak_meter')->nullable();
            $table->unsignedInteger('estimasi_menit')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('order_index')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('taxi_directions');
    }
};
