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
        Schema::create('archived_flights', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_flight_id')->nullable();
            $table->date('tanggal_penerbangan');
            $table->string('nomor_penerbangan');
            $table->unsignedBigInteger('airline_id')->nullable();
            $table->unsignedBigInteger('airport_asal_id')->nullable();
            $table->unsignedBigInteger('airport_tujuan_id')->nullable();
            $table->time('jam_jadwal');
            $table->time('jam_estimasi')->nullable();
            $table->time('jam_aktual')->nullable();
            $table->enum('jenis_penerbangan', ['departure', 'arrival']);
            $table->enum('tipe_layanan', ['domestik', 'internasional']);
            $table->unsignedBigInteger('gate_id')->nullable();
            $table->unsignedBigInteger('checkin_counter_id')->nullable();
            $table->unsignedBigInteger('baggage_claim_id')->nullable();
            $table->string('status');
            $table->text('catatan')->nullable();
            $table->timestamp('archived_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('archived_flights');
    }
};
