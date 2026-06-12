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
            $table->string('mode_default')->default('2-column')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('display_settings', function (Blueprint $table) {
            $table->enum('mode_default', ['landscape', 'portrait'])->default('landscape')->change();
        });
    }
};
