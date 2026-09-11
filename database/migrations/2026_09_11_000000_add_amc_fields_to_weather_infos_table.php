<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Kolom untuk layar AMC: jarak pandang, tutupan awan, dan jam berlaku slot
     * prakiraan. Tiga-tiganya sudah dikirim BMKG (vs, vs_text, tcc, datetime)
     * tetapi selama ini dibuang begitu saja saat fetch.
     */
    public function up(): void
    {
        Schema::table('weather_infos', function (Blueprint $table) {
            $table->unsignedInteger('jarak_pandang')->nullable()->after('arah_angin_derajat')
                ->comment('Jarak pandang dalam meter (BMKG: vs)');
            $table->string('jarak_pandang_teks', 32)->nullable()->after('jarak_pandang')
                ->comment('Jarak pandang versi teks BMKG, mis. "< 10 km" (BMKG: vs_text)');
            $table->unsignedTinyInteger('tutupan_awan')->nullable()->after('jarak_pandang_teks')
                ->comment('Tutupan awan dalam persen 0-100 (BMKG: tcc)');
            // Data BMKG adalah prakiraan per 3 jam sedangkan fetch berjalan tiap 30
            // menit: updated_at hanya menandai kapan kita mengambil, bukan kapan data
            // berlaku. Layar AMC harus bisa menampilkan keduanya.
            $table->timestamp('berlaku_pada')->nullable()->after('tutupan_awan')
                ->comment('Jam berlaku slot prakiraan (BMKG: datetime, UTC)');
        });
    }

    public function down(): void
    {
        Schema::table('weather_infos', function (Blueprint $table) {
            $table->dropColumn(['jarak_pandang', 'jarak_pandang_teks', 'tutupan_awan', 'berlaku_pada']);
        });
    }
};
