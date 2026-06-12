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
        Schema::table('display_settings', function (Blueprint $table) {
            $table->boolean('show_departures')->default(true)->after('tampilkan_logo_maskapai');
            $table->boolean('show_arrivals')->default(true)->after('show_departures');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            $table->dropColumn(['show_departures', 'show_arrivals']);
        });
    }
};
