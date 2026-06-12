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
            $table->integer('broadcast_count')->default(0)->after('tipe');
            $table->integer('max_broadcasts')->default(1)->after('broadcast_count');
            $table->timestamp('last_broadcast_at')->nullable()->after('max_broadcasts');
        });
    }

    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn(['broadcast_count', 'max_broadcasts', 'last_broadcast_at']);
        });
    }
};
