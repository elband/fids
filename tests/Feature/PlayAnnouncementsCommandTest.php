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
    public function test_deactivates_when_limit_reached(): void
    {
        config(['fids.pas.server_speaker' => true]);
        $ann = $this->announcement([
            'broadcast_count'   => 2,
            'last_broadcast_at' => now()->subMinutes(10),
        ]);
        $this->muteSpeaker(1);

        $this->artisan('fids:play-announcements')->assertSuccessful();

        $ann->refresh();
        $this->assertSame(3, (int) $ann->broadcast_count);
        $this->assertFalse((bool) $ann->status_aktif);
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

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
