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
        Schema::table('flights', function (Blueprint $table) {
            $table->boolean('is_master')->default(false)->after('id');
            $table->json('hari_operasi')->nullable()->after('is_master');
            $table->integer('frekuensi_per_minggu')->default(0)->after('hari_operasi');
            $table->date('tanggal_penerbangan')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('flights', function (Blueprint $table) {
            $table->dropColumn(['is_master', 'hari_operasi', 'frekuensi_per_minggu']);
            $table->date('tanggal_penerbangan')->nullable(false)->change();
        });
    }
};
