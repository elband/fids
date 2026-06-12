<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('world_clock_settings', function (Blueprint $table) {
            $table->boolean('use_background_image')->default(false)->after('show_ntp_status');
        });
    }

    public function down(): void
    {
        Schema::table('world_clock_settings', function (Blueprint $table) {
            $table->dropColumn('use_background_image');
        });
    }
};
