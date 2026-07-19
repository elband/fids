<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Mode Hemat (Raspberry Pi): matikan efek berat (bayangan ubin, gradient,
     * filter drop-shadow/blur, animasi flip) agar layar mulus di perangkat
     * berdaya rendah. Default true karena kiosk umumnya pakai Raspberry Pi.
     */
    public function up(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('display_settings', 'mode_hemat')) {
                $table->boolean('mode_hemat')->default(true)->after('auto_reload_jam');
            }
        });
    }

    public function down(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            if (Schema::hasColumn('display_settings', 'mode_hemat')) {
                $table->dropColumn('mode_hemat');
            }
        });
    }
};
