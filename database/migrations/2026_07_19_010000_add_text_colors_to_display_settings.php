<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah warna teks yang dapat diatur untuk layar TV publik:
     *  - warna_utama : warna teks utama (jam, no. penerbangan, gate).
     *  - warna_aksen : warna aksen (judul, header kolom, kota tujuan).
     * Kolom ini sudah dirujuk SettingResource sejak awal, kini diberi backing column.
     */
    public function up(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('display_settings', 'warna_utama')) {
                $table->string('warna_utama')->default('#ffffff')->after('tema_warna');
            }
            if (! Schema::hasColumn('display_settings', 'warna_aksen')) {
                $table->string('warna_aksen')->default('#fbbf24')->after('warna_utama');
            }
        });
    }

    public function down(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            foreach (['warna_utama', 'warna_aksen'] as $col) {
                if (Schema::hasColumn('display_settings', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
