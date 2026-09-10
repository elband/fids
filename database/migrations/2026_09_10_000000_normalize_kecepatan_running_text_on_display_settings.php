<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Kolom `kecepatan_running_text` sudah ada sejak migrasi awal tetapi tidak pernah
 * dipakai — durasi ticker dihardcode 25 detik di tiap halaman display. Mulai
 * sekarang kolom ini menjadi kecepatan ticker dengan skala 1-10 (sama seperti
 * `kecepatan_scroll`), jadi nilai lama (default 50) harus dinormalkan.
 *
 * 6 dipilih sebagai default karena memetakan ke 25 detik — persis perilaku lama.
 */
return new class extends Migration
{
    private const DEFAULT_SPEED = 6;

    public function up(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            $table->integer('kecepatan_running_text')->default(self::DEFAULT_SPEED)->change();
        });

        DB::table('display_settings')
            ->where('kecepatan_running_text', '<', 1)
            ->orWhere('kecepatan_running_text', '>', 10)
            ->orWhereNull('kecepatan_running_text')
            ->update(['kecepatan_running_text' => self::DEFAULT_SPEED]);
    }

    public function down(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            $table->integer('kecepatan_running_text')->default(50)->change();
        });
    }
};
