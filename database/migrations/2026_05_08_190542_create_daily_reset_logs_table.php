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
        Schema::create('daily_reset_logs', function (Blueprint $table) {
            $table->id();
            $table->date('tanggal_reset');
            $table->integer('total_penerbangan_diarsipkan')->default(0);
            $table->string('status');
            $table->text('catatan')->nullable();
            $table->timestamp('executed_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_reset_logs');
    }
};
