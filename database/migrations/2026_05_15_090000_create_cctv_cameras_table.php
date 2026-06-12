<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cctv_cameras', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('lokasi')->nullable();
            $table->string('grup', 64)->default('baggage')
                ->comment('Grup layar: baggage, boarding, checkin, dst');
            $table->enum('jenis_stream', ['iframe', 'mjpeg', 'youtube'])->default('iframe');
            $table->text('url_stream');
            $table->boolean('aktif')->default(true);
            $table->unsignedInteger('urutan')->default(0);
            $table->timestamps();

            $table->index(['grup', 'aktif', 'urutan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cctv_cameras');
    }
};
