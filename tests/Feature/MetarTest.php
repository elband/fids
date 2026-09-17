<?php

namespace Tests\Feature;

use App\Models\DisplaySetting;
use App\Models\MetarReport;
use App\Models\User;
use App\Services\Metar\MetarFetchException;
use App\Services\Metar\MetarParser;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use PHPUnit\Framework\Attributes\DataProvider;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * METAR bandara untuk layar AMC: scraping portal aviasi BMKG, status kegagalan
 * yang dijelaskan di layar, dan pengaturannya di panel admin.
 */
class MetarTest extends TestCase
{
    use RefreshDatabase;

    private const URL = 'https://web-aviation.bmkg.go.id/web/metar_speci.php';

    protected function setUp(): void
    {
        parent::setUp();
        // Waktu uji dalam zona waktu aplikasi, sama seperti produksi: Carbon::setTestNow
        // dengan objek UTC membuat Eloquent ikut membaca kolom tanggal sebagai UTC.
        Carbon::setTestNow(Carbon::parse('2026-09-17 06:10:00', 'UTC')->setTimezone(config('app.timezone')));
        DisplaySetting::create(['nama_bandara' => 'APT Pranoto', 'metar_aktif' => true, 'metar_url' => self::URL, 'metar_icao' => 'WALS']);
        Cache::flush();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function formPage(): string
    {
        return '<form method="POST"><input type="hidden" name="_token" value="abc123" autocomplete="off"></form>';
    }

    private function resultPage(): string
    {
        return '<table>'
            . '<tr><td>METAR WALS 170530Z 23005KT 180V250 2100 VV008 32/22 Q1009 TEMPO TL0600=</td></tr>'
            . '<tr><td>METAR WALS 170600Z 21006KT 180V240 3000 FU FEW025 32/22 Q1009 TEMPO TL0700 5000=</td></tr>'
            . '<tr><td>METAR WALL 170600Z 21006KT 7000 FEW020 31/24 Q1010 NOSIG=</td></tr>'
            . '</table>';
    }

    public function test_parser_reads_bmkg_metar_groups(): void
    {
        $r = MetarParser::parse('METAR WALS 170530Z 23005KT 180V250 2100 VV008 32/22 Q1009 TEMPO TL0600=', CarbonImmutable::now());

        $this->assertSame('WALS', $r['icao']);
        $this->assertSame('2026-09-17 05:30', $r['observed_at']->format('Y-m-d H:i'));
        $this->assertSame([230, 180, 250, 5], [$r['wind_dir_deg'], $r['wind_var_from'], $r['wind_var_to'], $r['wind_speed_kt']]);
        $this->assertSame(2100, $r['visibility_m']);
        $this->assertSame('VV008', $r['clouds']);
        $this->assertSame([32, 22, 1009], [$r['temperature_c'], $r['dew_point_c'], $r['qnh_hpa']]);
        $this->assertSame('TEMPO TL0600', $r['trend']);
    }

    public function test_parser_handles_cavok_variable_gust_negative_temp_and_previous_month(): void
    {
        $r = MetarParser::parse('SPECI COR WAAA 302330Z VRB03G15KT CAVOK M02/M05 Q1013 NOSIG=', CarbonImmutable::parse('2026-10-01 00:10', 'UTC'));

        $this->assertTrue($r['wind_variable']);
        $this->assertNull($r['wind_dir_deg']);
        $this->assertSame([3, 15], [$r['wind_speed_kt'], $r['wind_gust_kt']]);
        $this->assertSame(10000, $r['visibility_m']);
        $this->assertSame([-2, -5], [$r['temperature_c'], $r['dew_point_c']]);
        $this->assertSame('2026-09-30 23:30', $r['observed_at']->format('Y-m-d H:i'));

        $this->expectException(MetarFetchException::class);
        MetarParser::parse('TAF WALS 170500Z', CarbonImmutable::now());
    }

    public function test_fetch_saves_latest_report_for_configured_station_and_api_serves_it(): void
    {
        Http::fake(['web-aviation.bmkg.go.id/*' => Http::sequence()->push($this->formPage())->push($this->resultPage())]);

        $this->artisan('fids:fetch-metar')->assertExitCode(0);

        $report = MetarReport::where('icao', 'WALS')->firstOrFail();
        // Dibaca kembali tanpa pergeseran zona waktu.
        $this->assertSame('2026-09-17 06:00', $report->observed_at->copy()->setTimezone('UTC')->format('Y-m-d H:i'));
        $this->assertLessThan(15, abs($report->last_attempt_at->diffInMinutes(now())));
        $this->assertSame(3000, $report->visibility_m);
        $this->assertSame('FU', $report->present_weather);
        $this->assertNull($report->error_code);

        Http::assertSent(fn ($req) => $req->method() === 'POST'
            && $req['_token'] === 'abc123' && $req['stasiun'] === 'WALS');

        $this->getJson('/api/fids/metar')
            ->assertOk()
            ->assertJsonPath('data.enabled', true)
            ->assertJsonPath('data.report.visibility_m', 3000)
            ->assertJsonPath('data.report.qnh_hpa', 1009)
            ->assertJsonPath('data.problem', null);
    }

    public function test_blocked_request_keeps_last_report_and_explains_reason_on_screen(): void
    {
        MetarReport::create([
            'icao' => 'WALS', 'raw_text' => 'METAR WALS 170530Z 23005KT 2100 32/22 Q1009=',
            'observed_at' => now()->subMinutes(40), 'visibility_m' => 2100, 'last_success_at' => now()->subMinutes(30),
        ]);
        Http::fake(['web-aviation.bmkg.go.id/*' => Http::response('Forbidden', 403)]);

        $this->artisan('fids:fetch-metar')->assertExitCode(1);

        $report = MetarReport::where('icao', 'WALS')->firstOrFail();
        $this->assertSame(MetarFetchException::DIBLOKIR, $report->error_code);
        $this->assertSame(2100, $report->visibility_m);

        $this->getJson('/api/fids/metar')
            ->assertJsonPath('data.report.visibility_m', 2100)
            ->assertJsonPath('data.problem.code', 'diblokir')
            ->assertJsonPath('data.problem.message', fn ($m) => str_contains($m, 'HTTP 403') && str_contains($m, 'web-aviation.bmkg.go.id'));
    }

    /** @return array<string, array{0: callable, 1: string, 2: string}> */
    public static function failureProvider(): array
    {
        return [
            'timeout' => [fn () => throw new ConnectionException('cURL error 28: Operation timed out after 20001 milliseconds'), MetarFetchException::KONEKSI, 'timeout'],
            'dns' => [fn () => throw new ConnectionException('cURL error 6: Could not resolve host: web-aviation.bmkg.go.id'), MetarFetchException::KONEKSI, 'DNS'],
            'server error' => [fn () => Http::response('down', 503), MetarFetchException::HTTP, 'HTTP 503'],
            'form changed' => [fn () => Http::response('<html>maintenance</html>', 200), MetarFetchException::STRUKTUR, 'token'],
        ];
    }

    #[DataProvider('failureProvider')]
    public function test_failures_get_clear_reason(callable $response, string $code, string $needle): void
    {
        Http::fake(['web-aviation.bmkg.go.id/*' => $response]);

        $this->artisan('fids:fetch-metar')->assertExitCode(1);

        $report = MetarReport::where('icao', 'WALS')->firstOrFail();
        $this->assertSame($code, $report->error_code);
        $this->assertStringContainsString($needle, $report->error_message);
    }

    public function test_no_report_for_station_is_explained(): void
    {
        Http::fake(['web-aviation.bmkg.go.id/*' => Http::sequence()->push($this->formPage())->push('<table></table>')]);

        $this->artisan('fids:fetch-metar')->assertExitCode(1);

        $this->assertSame(MetarFetchException::KOSONG, MetarReport::where('icao', 'WALS')->value('error_code'));
    }

    public function test_api_explains_stopped_scheduler_and_stale_observation(): void
    {
        MetarReport::create([
            'icao' => 'WALS', 'raw_text' => 'METAR WALS 170300Z 23005KT 2100 32/22 Q1009=',
            'observed_at' => now()->subMinutes(190), 'last_attempt_at' => now()->subMinutes(120), 'last_success_at' => now()->subMinutes(120),
        ]);

        $this->getJson('/api/fids/metar')->assertJsonPath('data.problem.code', 'scheduler');

        MetarReport::where('icao', 'WALS')->firstOrFail()->update(['last_attempt_at' => now()->subMinutes(5)]);
        Cache::flush();

        $this->getJson('/api/fids/metar')->assertJsonPath('data.problem.code', 'basi');
    }

    public function test_api_explains_never_fetched_and_disabled_makes_no_request(): void
    {
        $this->getJson('/api/fids/metar')->assertJsonPath('data.problem.code', 'belum');

        DisplaySetting::query()->update(['metar_aktif' => false]);
        Cache::flush();
        Http::fake();

        $this->artisan('fids:fetch-metar')->assertExitCode(0);
        Http::assertNothingSent();
        $this->getJson('/api/fids/metar')->assertJsonPath('data.enabled', false)->assertJsonPath('data.problem', null);
    }

    public function test_fetch_is_scheduled_every_thirty_minutes(): void
    {
        $event = collect(app(Schedule::class)->events())
            ->first(fn ($e) => str_contains((string) $e->command, 'fids:fetch-metar'));

        $this->assertNotNull($event);
        $this->assertSame('*/30 * * * *', $event->expression);
        $this->assertTrue($event->withoutOverlapping);
    }

    public function test_admin_can_save_metar_settings_and_fetch_now(): void
    {
        Role::findOrCreate('Super Admin');
        $admin = User::factory()->create(['email_verified_at' => now()])->assignRole('Super Admin');
        $base = ['nama_bandara' => 'APT Pranoto', 'kecepatan_scroll' => 1, 'kecepatan_running_text' => 6, 'bahasa' => 'id'];

        $this->actingAs($admin)
            ->post(route('admin.display-settings.update'), $base + ['metar_aktif' => true, 'metar_url' => 'bukan-url', 'metar_icao' => 'WAL'])
            ->assertSessionHasErrors(['metar_url', 'metar_icao']);

        $this->actingAs($admin)
            ->post(route('admin.display-settings.update'), $base + ['metar_aktif' => true, 'metar_url' => self::URL, 'metar_icao' => 'wals'])
            ->assertSessionHasNoErrors();
        $this->assertSame('WALS', DisplaySetting::first()->metar_icao);

        Http::fake(['web-aviation.bmkg.go.id/*' => Http::sequence()->push($this->formPage())->push($this->resultPage())]);
        $this->actingAs($admin)
            ->post(route('admin.display-settings.fetch-metar'))
            ->assertSessionHas('success', fn ($m) => str_contains($m, 'METAR WALS 170600Z'));
    }
}
