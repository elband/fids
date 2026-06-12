<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('weather_infos', function (Blueprint $table) {
            $table->string('arah_angin', 8)->nullable()->after('kecepatan_angin')
                ->comment('Arah angin singkatan (N, NE, E, SE, S, SW, W, NW)');
            $table->unsignedSmallInteger('arah_angin_derajat')->nullable()->after('arah_angin')
                ->comment('Arah angin dalam derajat 0-360');
        });
    }

    public function down(): void
    {
        Schema::table('weather_infos', function (Blueprint $table) {
            $table->dropColumn(['arah_angin', 'arah_angin_derajat']);
        });
    }
};
