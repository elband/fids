<?php

namespace Tests\Feature;

use App\Models\DisplaySetting;
use App\Models\WeatherInfo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Layar AMC (/amc) beserta data pendukungnya.
 */
class AmcClockTest extends TestCase
{
    use RefreshDatabase;

    public function test_halaman_amc_bisa_dibuka_tanpa_login(): void
    {
        $this->get('/amc')->assertOk();
        $this->get('/public/amc-clock')->assertOk();
    }

    /**
     * Regresi: WeatherResource dulu mengirim 'wind_speed'/'humidity' yang bukan
     * kolom maupun accessor, sehingga data angin yang sudah tersimpan tidak
     * pernah sampai ke layar mana pun.
     */
    public function test_api_cuaca_mengirim_data_angin_dan_jarak_pandang(): void
    {
        WeatherInfo::create([
            'lokasi' => 'Bugis',
            'suhu' => 31,
            'kondisi_cuaca' => 'Cerah',
            'kelembapan' => 66,
            'kecepatan_angin' => 4.7,
            'arah_angin' => 'E',
            'arah_angin_derajat' => 128,
            'jarak_pandang' => 9000,
            'jarak_pandang_teks' => '< 10 km',
            'tutupan_awan' => 36,
            'berlaku_pada' => '2026-09-11 07:00:00',
        ]);
        Cache::forget('fids:api:weather');

        $this->getJson('/api/fids/weather')
            ->assertOk()
            ->assertJsonPath('data.kecepatan_angin', 4.7)
            ->assertJsonPath('data.arah_angin_derajat', 128)
            ->assertJsonPath('data.kelembapan', 66)
            ->assertJsonPath('data.jarak_pandang', 9000)
            ->assertJsonPath('data.jarak_pandang_teks', '< 10 km')
            ->assertJsonPath('data.tutupan_awan', 36);
    }

    /**
     * Regresi: pemilihan baris cuaca harus memakai updated_at, bukan created_at.
     * Saat kode wilayah BMKG diganti lalu dikembalikan, baris lokasi lama punya
     * created_at paling tua tetapi justru datanya yang paling baru; mengurutkan
     * dengan created_at membuat layar memajang lokasi basi tanpa batas.
     */
    public function test_api_cuaca_memilih_baris_yang_paling_baru_diperbarui(): void
    {
        $lama = WeatherInfo::create([
            'lokasi' => 'Sungai Siring', 'suhu' => 26, 'kondisi_cuaca' => 'Cerah',
        ]);
        $baru = WeatherInfo::create([
            'lokasi' => 'Bugis', 'suhu' => 31, 'kondisi_cuaca' => 'Berawan',
        ]);
        // Baris "Bugis" dibuat lebih dulu tetapi baru saja di-update oleh fetch.
        $baru->forceFill(['created_at' => now()->subMonths(2), 'updated_at' => now()])->save();
        $lama->forceFill(['created_at' => now(), 'updated_at' => now()->subHour()])->save();
        Cache::forget('fids:api:weather');

        $this->getJson('/api/fids/weather')
            ->assertOk()
            ->assertJsonPath('data.lokasi', 'Bugis');
    }

    /**
     * Regresi: last_updated dulu objek Carbon. Setelah keluar dari cache (dengan
     * serializable_classes = false) ia menjadi __PHP_Incomplete_Class, sehingga
     * layar AMC selalu menulis "diperbarui belum pernah" walau fetch berjalan.
     */
    public function test_api_cuaca_mengirim_last_updated_sebagai_string_setelah_dicache(): void
    {
        config([
            'cache.default' => 'array',
            'cache.stores.array.serialize' => true,
        ]);
        Cache::purge('array');

        WeatherInfo::create(['lokasi' => 'Sungai Siring', 'suhu' => 26, 'kondisi_cuaca' => 'Cerah']);

        $this->getJson('/api/fids/weather')->assertOk();
        $lastUpdated = $this->getJson('/api/fids/weather')->assertOk()->json('data.last_updated');

        $this->assertIsString($lastUpdated);
        $this->assertNotFalse(strtotime($lastUpdated));
    }

    /** Runway dipakai layar AMC untuk menghitung headwind/crosswind. */
    public function test_api_settings_mengirim_runway(): void
    {
        DisplaySetting::create([
            'nama_bandara' => 'APT Pranoto',
            'runway_kode' => '04/22',
            'runway_heading' => 40,
        ]);
        Cache::forget('fids:api:settings');

        $this->getJson('/api/fids/settings')
            ->assertOk()
            ->assertJsonPath('data.runway_kode', '04/22')
            ->assertJsonPath('data.runway_heading', 40);
    }

    /**
     * Jarak pandang, tutupan awan, dan jam berlaku slot prakiraan ikut disimpan
     * saat fetch — sebelumnya ketiganya dibuang meski dikirim BMKG.
     */
    public function test_fetch_bmkg_menyimpan_jarak_pandang_awan_dan_jam_berlaku(): void
    {
        DisplaySetting::create(['nama_bandara' => 'APT Pranoto', 'kode_bmkg' => '64.72.09.1004']);

        // Dua slot: yang dipilih harus slot terdekat dengan waktu sekarang.
        Http::fake([
            'api.bmkg.go.id/*' => Http::response([
                'data' => [[
                    'lokasi' => ['desa' => 'Bugis', 'kecamatan' => 'Samarinda Kota'],
                    'cuaca' => [[
                        [
                            'datetime' => now('UTC')->subHours(9)->format('Y-m-d\TH:i:s\Z'),
                            't' => 25, 'weather_desc' => 'Hujan', 'hu' => 90, 'ws' => 10,
                            'wd' => 'W', 'wd_deg' => 270, 'vs' => 2000, 'vs_text' => '< 3 km', 'tcc' => 100,
                        ],
                        [
                            'datetime' => now('UTC')->format('Y-m-d\TH:i:s\Z'),
                            't' => 31, 'weather_desc' => 'Cerah', 'hu' => 66, 'ws' => 4.7,
                            'wd' => 'E', 'wd_deg' => 128, 'vs' => 9000, 'vs_text' => '< 10 km', 'tcc' => 36,
                        ],
                    ]],
                ]],
            ], 200),
        ]);

        $this->artisan('fids:fetch-weather')->assertExitCode(0);

        $weather = WeatherInfo::where('lokasi', 'Bugis')->firstOrFail();
        $this->assertSame(9000, $weather->jarak_pandang);
        $this->assertSame('< 10 km', $weather->jarak_pandang_teks);
        $this->assertSame(36, $weather->tutupan_awan);
        $this->assertSame(128, $weather->arah_angin_derajat);
        $this->assertNotNull($weather->berlaku_pada);
        // Jam berlaku menandai slot prakiraan, bukan waktu pengambilan data.
        $this->assertLessThan(60, abs($weather->berlaku_pada->diffInMinutes(now())));
    }

    /** Arah runway di luar 0-359 ditolak supaya satu arah tidak punya dua nilai. */
    public function test_runway_heading_divalidasi(): void
    {
        $user = $this->adminUser();

        $this->actingAs($user)
            ->from('/admin/display-settings')
            ->post('/admin/display-settings', [
                'nama_bandara' => 'APT Pranoto',
                'kecepatan_scroll' => 1,
                'kecepatan_running_text' => 6,
                'bahasa' => 'id',
                'runway_heading' => 360,
            ])
            ->assertSessionHasErrors('runway_heading');
    }

    private function adminUser(): \App\Models\User
    {
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $user = \App\Models\User::factory()->create();
        $user->assignRole('Super Admin');

        return $user;
    }
}
