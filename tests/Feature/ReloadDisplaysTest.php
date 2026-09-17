<?php

namespace Tests\Feature;

use App\Models\DisplaySetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ReloadDisplaysTest extends TestCase
{
    use RefreshDatabase;

    public function test_reload_changes_token_clears_cache_and_preserves_language(): void
    {
        $this->freezeTime();
        $setting = DisplaySetting::create(['bahasa' => 'id', 'force_reload_at' => now()]);
        $previous = $setting->force_reload_at->timestamp;
        Cache::put('fids:api:settings', ['stale' => true]);
        $this->artisan('fids:reload-displays')->assertSuccessful();
        $this->assertGreaterThan($previous, $setting->fresh()->force_reload_at->timestamp);
        $this->assertSame('id', $setting->fresh()->bahasa);
        $this->assertNull(Cache::get('fids:api:settings'));
    }

    public function test_empty_install_does_not_create_display_settings(): void
    {
        $this->artisan('fids:reload-displays')->assertSuccessful();
        $this->assertDatabaseCount('display_settings', 0);
    }
}
