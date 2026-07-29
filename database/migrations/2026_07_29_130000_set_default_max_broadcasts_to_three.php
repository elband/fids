<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Default kolom max_broadcasts masih 1 sejak migrasi 2026_05_11, padahal
 * default yang dimaksud sistem adalah 3 (FlightService dan form PAS sama-sama
 * memakai 3). Migrasi 2026_05_14 hanya memperbaiki baris yang sudah terlanjur
 * ada, bukan defaultnya — sehingga setiap penyisipan yang tidak menyebut kolom
 * ini tetap mendapat 1, lalu pengumumannya hilang setelah sekali putar.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->integer('max_broadcasts')->default(3)->change();
        });
    }

    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->integer('max_broadcasts')->default(1)->change();
        });
    }
};
