<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Arah runway dipakai layar AMC untuk menghitung komponen headwind &
     * crosswind. Sengaja nullable: bila operator belum mengisinya, layar
     * menyembunyikan bagian itu daripada menampilkan angka yang salah.
     */
    public function up(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            $table->string('runway_kode', 16)->nullable()->after('kode_bmkg')
                ->comment('Label runway yang ditampilkan, mis. "04/22"');
            $table->unsignedSmallInteger('runway_heading')->nullable()->after('runway_kode')
                ->comment('Heading runway dalam derajat 0-359 (arah lepas landas utama)');
        });
    }

    public function down(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            $table->dropColumn(['runway_kode', 'runway_heading']);
        });
    }
};
