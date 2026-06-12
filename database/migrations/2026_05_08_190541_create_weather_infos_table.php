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
        Schema::create('weather_infos', function (Blueprint $table) {
            $table->id();
            $table->string('lokasi');
            $table->decimal('suhu', 5, 2);
            $table->string('kondisi_cuaca');
            $table->integer('kelembapan')->nullable();
            $table->string('kecepatan_angin')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('weather_infos');
    }
};
