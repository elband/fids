<?php

namespace Tests\Feature\Admin;

use App\Models\DisplaySetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicScreenEditorTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_editor_page(): void
    {
        $response = $this->get(route('admin.public-screen.editor'));

        $response->assertRedirect(route('login'));
    }

    public function test_guest_cannot_submit_editor_save(): void
    {
        $response = $this->post(route('admin.public-screen.editor.save'), [
            'screen_title' => 'Guest Try',
            'layout_type' => '2-column',
            'show_clock' => true,
            'show_weather' => true,
            'show_ticker' => true,
            'show_schedule_table' => true,
            'theme_color' => '#112233',
        ]);

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_save_editor_configuration(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('admin.public-screen.editor.save'), [
            'screen_title' => 'TEST SCREEN',
            'layout_type' => '2-column',
            'show_clock' => true,
            'show_weather' => true,
            'show_ticker' => true,
            'show_schedule_table' => true,
            'theme_color' => '#112233',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('display_settings', [
            'nama_bandara' => 'TEST SCREEN',
            'mode_default' => '2-column',
            'tema_warna' => '#112233',
            'tampilkan_cuaca' => 1,
            'tampilkan_logo_maskapai' => 1,
        ]);

        $setting = DisplaySetting::query()->first();
        $this->assertNotNull($setting);
        $this->assertNotEmpty($setting->teks_ticker);
    }

    public function test_save_editor_configuration_fails_with_invalid_payload(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->from(route('admin.public-screen.editor'))->post(route('admin.public-screen.editor.save'), [
            'screen_title' => '',
            'layout_type' => 'invalid-layout',
            'show_clock' => 'yes',
            'show_weather' => 'yes',
            'show_ticker' => 'yes',
            'show_schedule_table' => 'yes',
            'theme_color' => 'not-a-color',
        ]);

        $response->assertRedirect(route('admin.public-screen.editor'));
        $response->assertSessionHasErrors([
            'screen_title',
            'layout_type',
            'theme_color',
        ]);
    }

    public function test_editor_page_loads_with_initial_settings(): void
    {
        $user = User::factory()->create();

        DisplaySetting::query()->create([
            'nama_bandara' => 'My Airport',
            'mode_default' => '3-column',
            'tema_warna' => '#334455',
            'tampilkan_cuaca' => true,
            'tampilkan_logo_maskapai' => false,
            'teks_ticker' => 'Ticker aktif',
        ]);

        $response = $this->actingAs($user)->get(route('admin.public-screen.editor'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/LayarPublik/Editor')
            ->where('initialSettings.screen_title', 'My Airport')
            ->where('initialSettings.layout_type', '3-column')
            ->where('initialSettings.theme_color', '#334455')
        );
    }
}
