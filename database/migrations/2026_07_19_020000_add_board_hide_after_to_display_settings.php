<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Durasi (menit) sebelum penerbangan yang sudah berangkat/tiba disembunyikan
     * dari papan keberangkatan/kedatangan. Default 180 menit (3 jam).
     * 0 = tidak pernah disembunyikan.
     */
    public function up(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('display_settings', 'board_hide_after_menit')) {
                $table->integer('board_hide_after_menit')->default(180)->after('bagasi_kamera_selesai_menit');
            }
        });
    }

    public function down(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            if (Schema::hasColumn('display_settings', 'board_hide_after_menit')) {
                $table->dropColumn('board_hide_after_menit');
            }
        });
    }
};
