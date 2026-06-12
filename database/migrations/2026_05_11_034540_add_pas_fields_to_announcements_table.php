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
        Schema::table('announcements', function (Blueprint $table) {
            $table->string('bahasa')->default('id')->after('isi_pengumuman');
            $table->string('target')->nullable()->after('bahasa');
            $table->string('mode')->default('manual')->after('target');
            $table->string('tipe')->default('running-text')->after('mode'); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn(['bahasa', 'target', 'mode', 'tipe']);
        });
    }
};
