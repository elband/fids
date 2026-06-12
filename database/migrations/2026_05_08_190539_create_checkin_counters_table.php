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
        Schema::create('checkin_counters', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_counter')->unique();
            $table->string('area')->nullable();
            $table->string('terminal');
            $table->foreignId('airline_id')->nullable()->constrained('airlines')->onDelete('set null');
            $table->enum('status_counter', ['buka', 'tutup', 'standby'])->default('tutup');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('checkin_counters');
    }
};
