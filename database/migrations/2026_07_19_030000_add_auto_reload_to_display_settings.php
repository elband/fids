<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Interval (jam) auto-reload penuh tiap layar publik sebagai jaring pengaman
     * kiosk 24/7. Default 6 jam. 0 = nonaktif (hanya andalkan polling + tombol
     * "Segarkan Semua Layar TV").
     */
    public function up(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('display_settings', 'auto_reload_jam')) {
                $table->integer('auto_reload_jam')->default(6)->after('board_hide_after_menit');
            }
        });
    }

    public function down(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            if (Schema::hasColumn('display_settings', 'auto_reload_jam')) {
                $table->dropColumn('auto_reload_jam');
            }
        });
    }
};
