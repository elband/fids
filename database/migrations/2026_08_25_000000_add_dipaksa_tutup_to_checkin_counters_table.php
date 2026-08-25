<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('checkin_counters', function (Blueprint $table) {
            // Penutupan paksa dari panel admin: layar counter menampilkan kondisi
            // tutup walau ada penerbangan yang check-in-nya terbuka.
            //
            // Kolom terpisah dari status_counter karena kolom itu default-nya 'tutup'
            // untuk seluruh counter yang sudah ada, sehingga menghormatinya sebagai
            // penutupan paksa akan memadamkan semua layar counter di lapangan
            // sekaligus. Default false di sini berarti perilaku otomatis lama tetap
            // berlaku sampai petugas benar-benar menekan tombol tutup.
            $table->boolean('dipaksa_tutup')->default(false)->after('status_counter');
        });
    }

    public function down(): void
    {
        Schema::table('checkin_counters', function (Blueprint $table) {
            $table->dropColumn('dipaksa_tutup');
        });
    }
};
