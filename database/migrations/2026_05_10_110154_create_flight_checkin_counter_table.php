<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('flight_checkin_counter', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flight_id')->constrained()->onDelete('cascade');
            $table->foreignId('checkin_counter_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });

        // Migrate existing data
        $flights = DB::table('flights')->whereNotNull('checkin_counter_id')->get();
        foreach ($flights as $flight) {
            DB::table('flight_checkin_counter')->insert([
                'flight_id' => $flight->id,
                'checkin_counter_id' => $flight->checkin_counter_id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('flight_checkin_counter');
    }
};
