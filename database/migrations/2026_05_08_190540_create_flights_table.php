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
        Schema::create('flights', function (Blueprint $table) {
            $table->id();
            $table->date('tanggal_penerbangan');
            $table->string('nomor_penerbangan');
            $table->foreignId('airline_id')->constrained('airlines')->onDelete('cascade');
            $table->foreignId('airport_asal_id')->constrained('airports')->onDelete('cascade');
            $table->foreignId('airport_tujuan_id')->constrained('airports')->onDelete('cascade');
            $table->time('jam_jadwal');
            $table->time('jam_estimasi')->nullable();
            $table->time('jam_aktual')->nullable();
            $table->enum('jenis_penerbangan', ['departure', 'arrival']);
            $table->enum('tipe_layanan', ['domestik', 'internasional']);
            $table->foreignId('gate_id')->nullable()->constrained('gates')->onDelete('set null');
            $table->foreignId('checkin_counter_id')->nullable()->constrained('checkin_counters')->onDelete('set null');
            $table->foreignId('baggage_claim_id')->nullable()->constrained('baggage_claims')->onDelete('set null');
            $table->string('status')->default('Scheduled');
            $table->text('catatan')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('flights');
    }
};
