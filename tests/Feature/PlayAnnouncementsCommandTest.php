<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Services\AudioService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

/**
 * Pemutar PAS sisi server: tanpa ini, pengumuman otomatis hanya terhitung
 * bila kebetulan ada browser yang membukanya, sehingga broadcast_count mandek
 * dan pengumuman tak pernah mencapai max_broadcasts.
 */
class PlayAnnouncementsCommandTest extends TestCase
{
    use RefreshDatabase;

    private function announcement(array $overrides = []): Announcement
    {
        return Announcement::create(array_merge([
            'judul'              => 'Uji Server Speaker',
            'isi_pengumuman'     => 'Tes pengumuman',
            'bahasa'             => 'Indonesia',
            'target'             => 'Server Speakers',
            'mode'               => 'Automatic',
            'tipe'               => 'pas',
            'kategori'           => 'PAS',
            'mulai_tayang'       => now(),
            'status_aktif'       => true,
            'broadcast_count'    => 0,
            'max_broadcasts'     => 3,
            'interval_pemutaran' => 4,
        ], $overrides));
    }

    /** Speaker dibisukan agar pengujian tidak memutar audio sungguhan. */
    private function muteSpeaker(int $times): void
    {
        $this->mock(AudioService::class, function ($mock) use ($times) {
            $mock->shouldReceive('speak')->times($times);
        });
    }

    public function test_does_nothing_when_server_speaker_disabled(): void
    {
        config(['fids.pas.server_speaker' => false]);
        $ann = $this->announcement();
        $this->muteSpeaker(0);

        $this->artisan('fids:play-announcements')->assertSuccessful();

        $this->assertSame(0, (int) $ann->fresh()->broadcast_count);
    }

    public function test_plays_and_increments_when_enabled(): void
    {
        config(['fids.pas.server_speaker' => true]);
        $ann = $this->announcement();
        $this->muteSpeaker(1);

        $this->artisan('fids:play-announcements')->assertSuccessful();

        $this->assertSame(1, (int) $ann->fresh()->broadcast_count);
        $this->assertTrue((bool) $ann->fresh()->status_aktif);
    }

    /** Interval belum lewat -> tidak diputar ulang (tidak spam tiap menit). */
    public function test_respects_interval_between_plays(): void
    {
        config(['fids.pas.server_speaker' => true]);
        $ann = $this->announcement(['broadcast_count' => 1, 'last_broadcast_at' => now()->subMinute()]);
        $this->muteSpeaker(0);

        $this->artisan('fids:play-announcements')->assertSuccessful();

        $this->assertSame(1, (int) $ann->fresh()->broadcast_count);
    }

    /** Pemutaran terakhir menonaktifkan pengumuman agar keluar dari antrian. */
    public function test_deletes_when_limit_reached(): void
    {
        config(['fids.pas.server_speaker' => true]);
        $ann = $this->announcement([
            'broadcast_count'   => 2,
            'last_broadcast_at' => now()->subMinutes(10),
        ]);
        $this->muteSpeaker(1);

        $this->artisan('fids:play-announcements')->assertSuccessful();

        $this->assertDatabaseMissing('announcements', ['id' => $ann->id]);
    }

    /** --check hanya mendiagnosis: tidak memutar, tidak menyentuh hitungan. */
    public function test_check_never_plays_or_counts(): void
    {
        config(['fids.pas.server_speaker' => true]);
        $ann = $this->announcement();
        $this->muteSpeaker(0);

        $this->artisan('fids:play-announcements', ['--check' => true]);

        $this->assertSame(0, (int) $ann->fresh()->broadcast_count);
    }

    /** --check gagal (exit non-nol) saat speaker server belum diaktifkan. */
    public function test_check_fails_when_disabled(): void
    {
        config(['fids.pas.server_speaker' => false]);
        $this->muteSpeaker(0);

        $this->artisan('fids:play-announcements', ['--check' => true])->assertFailed();
    }

    /** Target selain "Server Speakers" ditangani pemutar browser, bukan server. */
    public function test_ignores_other_targets(): void
    {
        config(['fids.pas.server_speaker' => true]);
        $ann = $this->announcement(['target' => 'All Public Displays']);
        $this->muteSpeaker(0);

        $this->artisan('fids:play-announcements')->assertSuccessful();

        $this->assertSame(0, (int) $ann->fresh()->broadcast_count);
    }

    public function test_three_plays_follow_card_interval_then_delete(): void
    {
        config(['fids.pas.server_speaker' => true]);
        $ann = $this->announcement(['max_broadcasts' => 3, 'interval_pemutaran' => 4]);
        $this->muteSpeaker(3);

        $this->artisan('fids:play-announcements')->assertSuccessful();
        $this->assertSame(2, $ann->fresh()->max_broadcasts - $ann->fresh()->broadcast_count);
        $this->travel(3)->minutes();
        $this->artisan('fids:play-announcements')->assertSuccessful();
        $this->assertSame(1, (int) $ann->fresh()->broadcast_count);
        $this->travel(1)->minutes();
        $this->artisan('fids:play-announcements')->assertSuccessful();
        $this->assertSame(1, $ann->fresh()->max_broadcasts - $ann->fresh()->broadcast_count);
        $this->travel(4)->minutes();
        $this->artisan('fids:play-announcements')->assertSuccessful();
        $this->assertDatabaseMissing('announcements', ['id' => $ann->id]);
        $this->artisan('fids:play-announcements')->assertSuccessful();
    }

    public function test_single_play_is_deleted_after_audio_returns(): void
    {
        config(['fids.pas.server_speaker' => true]);
        $ann = $this->announcement(['max_broadcasts' => 1]);
        $this->mock(AudioService::class, function ($mock) use ($ann) {
            $mock->shouldReceive('speak')->once()->with('Tes pengumuman', 1, 150, true)
                ->andReturnUsing(function () use ($ann) {
                    $this->assertDatabaseHas('announcements', ['id' => $ann->id]);
                });
        });
        $this->artisan('fids:play-announcements')->assertSuccessful();
        $this->assertDatabaseMissing('announcements', ['id' => $ann->id]);
    }

    public function test_custom_interval_is_respected_to_the_second(): void
    {
        config(['fids.pas.server_speaker' => true]);
        $this->freezeTime();
        $ann = $this->announcement(['interval_pemutaran' => 7]);
        $this->muteSpeaker(2);
        $this->artisan('fids:play-announcements')->assertSuccessful();
        $this->travel(419)->seconds();
        $this->artisan('fids:play-announcements')->assertSuccessful();
        $this->assertSame(1, (int) $ann->fresh()->broadcast_count);
        $this->travel(1)->seconds();
        $this->artisan('fids:play-announcements')->assertSuccessful();
        $this->assertSame(2, (int) $ann->fresh()->broadcast_count);
    }

    public function test_failed_third_play_can_retry_without_losing_announcement(): void
    {
        config(['fids.pas.server_speaker' => true]);
        $ann = $this->announcement(['broadcast_count' => 2, 'last_broadcast_at' => now()->subMinutes(10)]);
        $this->mock(AudioService::class, function ($mock) {
            $mock->shouldReceive('speak')->once()->andThrow(new \RuntimeException('Speaker busy'));
        });
        $this->artisan('fids:play-announcements')->assertFailed();
        $this->assertSame(2, (int) $ann->fresh()->broadcast_count);
        $this->assertTrue($ann->fresh()->status_aktif);
        $this->muteSpeaker(1);
        $this->artisan('fids:play-announcements')->assertSuccessful();
        $this->assertDatabaseMissing('announcements', ['id' => $ann->id]);
    }

    public function test_failed_audio_remains_pending(): void
    {
        config(['fids.pas.server_speaker' => true]);
        $ann = $this->announcement(['max_broadcasts' => 1]);
        $this->mock(AudioService::class, function ($mock) {
            $mock->shouldReceive('speak')->once()->andThrow(new \RuntimeException('Playback failed'));
        });
        $this->artisan('fids:play-announcements')->assertFailed();
        $this->assertSame(0, (int) $ann->fresh()->broadcast_count);
        $this->assertTrue($ann->fresh()->status_aktif);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
