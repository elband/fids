<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pengamatan METAR bandara untuk layar AMC, di-scrape dari portal aviasi BMKG.
 *
 * Satu baris per stasiun ICAO. Kolom status (last_*, error_*) ikut disimpan di
 * baris yang sama supaya layar bisa menjelaskan kenapa data tidak bisa ditarik
 * sambil tetap menampilkan pengamatan terakhir yang berhasil.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            $table->boolean('metar_aktif')->default(true)->after('runway_heading');
            $table->string('metar_url')->nullable()->after('metar_aktif')
                ->default('https://web-aviation.bmkg.go.id/web/metar_speci.php');
            $table->string('metar_icao', 4)->nullable()->after('metar_url')->default('WALS');
        });

        Schema::create('metar_reports', function (Blueprint $table) {
            $table->id();
            $table->string('icao', 4)->unique();
            $table->text('raw_text')->nullable();
            $table->timestamp('observed_at')->nullable();
            $table->unsignedSmallInteger('wind_dir_deg')->nullable();
            $table->boolean('wind_variable')->default(false);
            $table->unsignedSmallInteger('wind_var_from')->nullable();
            $table->unsignedSmallInteger('wind_var_to')->nullable();
            $table->unsignedSmallInteger('wind_speed_kt')->nullable();
            $table->unsignedSmallInteger('wind_gust_kt')->nullable();
            $table->unsignedInteger('visibility_m')->nullable();
            $table->string('present_weather')->nullable();
            $table->string('clouds')->nullable();
            $table->smallInteger('temperature_c')->nullable();
            $table->smallInteger('dew_point_c')->nullable();
            $table->unsignedSmallInteger('qnh_hpa')->nullable();
            $table->string('trend')->nullable();
            $table->timestamp('last_attempt_at')->nullable();
            $table->timestamp('last_success_at')->nullable();
            $table->string('error_code', 32)->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metar_reports');

        Schema::table('display_settings', function (Blueprint $table) {
            $table->dropColumn(['metar_aktif', 'metar_url', 'metar_icao']);
        });
    }
};
