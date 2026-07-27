<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('taxi_fares', function (Blueprint $table) {
            $table->id();
            $table->string('wilayah')->default('Umum');       // pengelompokan (mis. Samarinda, Balikpapan)
            $table->string('tujuan');
            $table->string('jenis_kendaraan')->default('Taksi Reguler');
            $table->unsignedBigInteger('tarif');              // rupiah, bilangan bulat
            $table->unsignedBigInteger('tarif_sebelumnya')->nullable(); // untuk highlight perubahan
            $table->date('berlaku_mulai')->nullable();
            $table->date('berlaku_sampai')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('order_index')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'wilayah', 'order_index']);
            $table->index(['berlaku_mulai', 'berlaku_sampai']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('taxi_fares');
    }
};
