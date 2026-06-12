<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ntp_settings', function (Blueprint $table) {
            $table->id();
            $table->string('ntp_server_1')->default('id.pool.ntp.org');
            $table->string('ntp_server_2')->nullable()->default('ntp.bmkg.go.id');
            $table->string('ntp_server_3')->nullable()->default('time.google.com');
            $table->integer('sync_interval')->default(3600)->comment('Interval sinkronisasi dalam detik');
            $table->boolean('auto_sync')->default(true);
            $table->timestamp('last_sync_at')->nullable();
            $table->string('last_sync_status')->nullable()->comment('success, failed, pending');
            $table->decimal('last_offset_ms', 10, 3)->nullable()->comment('Offset waktu dalam milidetik');
            $table->decimal('last_delay_ms', 10, 3)->nullable()->comment('Network delay dalam milidetik');
            $table->string('last_server_used')->nullable();
            $table->text('last_error')->nullable();
            $table->json('sync_history')->nullable()->comment('Riwayat 10 sinkronisasi terakhir');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ntp_settings');
    }
};
