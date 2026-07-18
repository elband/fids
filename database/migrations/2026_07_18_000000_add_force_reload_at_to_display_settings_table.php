<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Sinyal "segarkan semua layar TV". Diperbarui saat admin menekan tombol
     * refresh; setiap layar publik membandingkan nilai ini dan me-reload dirinya
     * saat berubah.
     */
    public function up(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            $table->timestamp('force_reload_at')->nullable()->after('timezone');
        });
    }

    public function down(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            $table->dropColumn('force_reload_at');
        });
    }
};
