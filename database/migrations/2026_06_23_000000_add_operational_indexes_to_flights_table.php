<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Audit M-04: tambah index untuk kueri operasional display & laporan.
 * Kolom berikut sering difilter/diurutkan oleh scope today()/daily()/departure()
 * /arrival() + whereIn('status', ...) + orderBy('jam_jadwal') di hampir semua
 * endpoint display, sehingga tanpa index berisiko full table scan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flights', function (Blueprint $table) {
            // Index komposit untuk kueri operasional utama
            $table->index(
                ['is_master', 'jenis_penerbangan', 'tanggal_penerbangan', 'jam_jadwal'],
                'idx_flights_ops'
            );
            // Filter status (whereIn status) sangat sering dipakai
            $table->index('status', 'idx_flights_status');
            // Lookup berdasarkan nomor penerbangan (API/pencarian)
            $table->index('nomor_penerbangan', 'idx_flights_nomor');
        });
    }

    public function down(): void
    {
        Schema::table('flights', function (Blueprint $table) {
            $table->dropIndex('idx_flights_ops');
            $table->dropIndex('idx_flights_status');
            $table->dropIndex('idx_flights_nomor');
        });
    }
};
