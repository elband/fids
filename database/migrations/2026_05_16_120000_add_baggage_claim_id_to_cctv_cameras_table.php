<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cctv_cameras', function (Blueprint $table) {
            $table->foreignId('baggage_claim_id')
                ->nullable()
                ->after('grup')
                ->constrained('baggage_claims')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('cctv_cameras', function (Blueprint $table) {
            $table->dropConstrainedForeignId('baggage_claim_id');
        });
    }
};
