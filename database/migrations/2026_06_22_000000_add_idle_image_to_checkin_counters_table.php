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
        Schema::table('checkin_counters', function (Blueprint $table) {
            // Gambar yang ditampilkan di layar display saat counter tidak aktif (tutup/standby).
            $table->string('idle_image')->nullable()->after('status_counter');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('checkin_counters', function (Blueprint $table) {
            $table->dropColumn('idle_image');
        });
    }
};
