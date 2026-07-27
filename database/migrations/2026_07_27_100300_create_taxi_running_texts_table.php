<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('taxi_running_texts', function (Blueprint $table) {
            $table->id();
            $table->text('pesan');
            $table->text('pesan_en')->nullable();
            $table->string('warna', 20)->default('#fbbf24');
            $table->unsignedInteger('prioritas')->default(0); // besar = tampil lebih dulu
            $table->dateTime('mulai_at')->nullable();
            $table->dateTime('selesai_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'prioritas']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('taxi_running_texts');
    }
};
