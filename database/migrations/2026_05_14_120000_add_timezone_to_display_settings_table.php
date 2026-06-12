<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            $table->string('timezone', 64)
                ->nullable()
                ->after('bahasa')
                ->comment('Zona waktu sumber jam pada tampilan FIDS, contoh: Asia/Makassar');
        });
    }

    public function down(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            $table->dropColumn('timezone');
        });
    }
};
