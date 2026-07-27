<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Panel jadwal & tarif kini bergulir ke atas terus-menerus, bukan berganti
 * halaman. Setting lamanya dipakai ulang sebagai kecepatan gulir agar operator
 * tetap punya satu kendali dan nilainya tidak hilang.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('taxi_settings', function (Blueprint $table) {
            $table->renameColumn('fare_rotate_detik', 'scroll_detik_per_layar');
        });
    }

    public function down(): void
    {
        Schema::table('taxi_settings', function (Blueprint $table) {
            $table->renameColumn('scroll_detik_per_layar', 'fare_rotate_detik');
        });
    }
};
