<?php

namespace Tests\Feature;

use App\Models\Announcement;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Audit M-07 — regresi untuk API display & temuan C-03.
 */
class DisplayApiTest extends TestCase
{
    use RefreshDatabase;

    /** Endpoint display publik mengembalikan amplop {data: [...]}. */
    public function test_departures_endpoint_returns_data_envelope(): void
    {
        $this->getJson('/api/fids/departures')
            ->assertOk()
            ->assertJsonStructure(['data']);
    }

    /** API transaksi mengikuti format referensi {data:{sukses,pesan,result}}. */
    public function test_transaksi_keberangkatan_envelope(): void
    {
        $this->getJson('/api/transaksi/keberangkatan')
            ->assertOk()
            ->assertJsonStructure(['data' => ['sukses', 'pesan', 'result']]);
    }

    /**
     * C-03: endpoint publik "played" menaikkan hitungan namun TIDAK menghapus data.
     * Saat batas tercapai, pengumuman hanya dinonaktifkan (status_aktif = false).
     */
    public function test_played_endpoint_soft_deactivates_and_never_deletes(): void
    {
        $ann = Announcement::create([
            'judul'           => 'Uji',
            'isi_pengumuman'  => 'Tes pengumuman',
            'bahasa'          => 'Indonesia',
            'target'          => 'All Public Displays',
            'mode'            => 'Automatic',
            'tipe'            => 'pas',
            'kategori'        => 'PAS',
            'mulai_tayang'    => now(),
            'status_aktif'    => true,
            'broadcast_count' => 0,
            'max_broadcasts'  => 1,
        ]);

        $this->postJson("/api/fids/announcements/{$ann->id}/played")
            ->assertOk()
            ->assertJson(['success' => true, 'finished' => true]);

        // Record TETAP ADA (tidak dihapus oleh kanal publik)...
        $this->assertDatabaseHas('announcements', ['id' => $ann->id]);
        // ...namun dinonaktifkan.
        $this->assertFalse((bool) $ann->fresh()->status_aktif);
    }

    /**
     * Debounce lintas-layar: banyak layar melapor "played" hampir bersamaan hanya
     * boleh menaikkan broadcast_count SEKALI (bukan sekali per layar).
     */
    public function test_played_endpoint_debounces_multiple_screens(): void
    {
        $ann = Announcement::create([
            'judul'           => 'Uji Debounce',
            'isi_pengumuman'  => 'Tes',
            'bahasa'          => 'Indonesia',
            'target'          => 'All Public Displays',
            'mode'            => 'Automatic',
            'tipe'            => 'pas',
            'kategori'        => 'PAS',
            'mulai_tayang'    => now(),
            'status_aktif'    => true,
            'broadcast_count' => 0,
            'max_broadcasts'  => 3,
        ]);

        // Tiga layar melapor dalam jendela debounce yang sama.
        for ($i = 0; $i < 3; $i++) {
            $this->postJson("/api/fids/announcements/{$ann->id}/played")->assertOk();
        }

        // Hanya dihitung sekali, dan pengumuman masih aktif (belum capai batas 3).
        $this->assertSame(1, (int) $ann->fresh()->broadcast_count);
        $this->assertTrue((bool) $ann->fresh()->status_aktif);
    }
}
