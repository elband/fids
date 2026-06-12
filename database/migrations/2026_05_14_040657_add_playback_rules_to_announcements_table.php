<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->integer('interval_pemutaran')->default(4)->after('max_broadcasts');
        });

        // Update existing rows that still have the old default of 1
        \DB::table('announcements')->where('max_broadcasts', 1)->update(['max_broadcasts' => 3]);
    }

    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn('interval_pemutaran');
        });
    }
};
