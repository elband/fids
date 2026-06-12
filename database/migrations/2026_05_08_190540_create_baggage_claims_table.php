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
        Schema::create('baggage_claims', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_belt')->unique();
            $table->string('area')->nullable();
            $table->string('terminal');
            $table->enum('status_belt', ['aktif', 'tidak_aktif', 'maintenance'])->default('aktif');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('baggage_claims');
    }
};
