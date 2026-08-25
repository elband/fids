<?php

namespace Tests\Feature;

use App\Models\CheckinCounter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Regresi "Gambar Saat Tutup" pada tombol Edit kartu counter.
 *
 * Form Inertia selalu mengirim field idle_image (kosong bila operator tidak
 * memilih berkas baru), sehingga update biasa — mis. hanya mengubah status —
 * tidak boleh menghapus gambar yang sudah tersimpan.
 */
class CheckinCounterIdleImageTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        Role::findOrCreate('Super Admin');
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole('Super Admin');

        return $user;
    }

    private function counterWithImage(): CheckinCounter
    {
        return CheckinCounter::create([
            'nomor_counter' => '02',
            'terminal' => 'Domestik',
            'status_counter' => 'tutup',
            'idle_image' => 'checkin-counters/lama.png',
        ]);
    }

    public function test_upload_menyimpan_gambar(): void
    {
        Storage::fake('public');
        $counter = CheckinCounter::create(['nomor_counter' => '03', 'terminal' => 'Domestik', 'status_counter' => 'tutup']);

        $this->actingAs($this->admin())
            ->put(route('admin.checkin-counters.update', $counter->id), [
                'nomor_counter' => '03',
                'terminal' => 'Domestik',
                'status_counter' => 'tutup',
                'idle_image' => UploadedFile::fake()->image('baru.png'),
            ])->assertRedirect();

        $counter->refresh();
        $this->assertNotNull($counter->idle_image);
        Storage::disk('public')->assertExists($counter->idle_image);
    }

    public function test_edit_tanpa_pilih_berkas_tidak_menghapus_gambar(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('checkin-counters/lama.png', 'x');
        $counter = $this->counterWithImage();

        // Persis payload form saat operator hanya menekan Simpan:
        // idle_image dikirim kosong dan remove_idle_image = false.
        $this->actingAs($this->admin())
            ->put(route('admin.checkin-counters.update', $counter->id), [
                'nomor_counter' => '02',
                'terminal' => 'Domestik',
                'status_counter' => 'buka',
                'idle_image' => null,
                'remove_idle_image' => false,
            ])->assertRedirect();

        $counter->refresh();
        $this->assertSame('checkin-counters/lama.png', $counter->idle_image);
        Storage::disk('public')->assertExists('checkin-counters/lama.png');
    }

    public function test_centang_hapus_menghilangkan_gambar(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('checkin-counters/lama.png', 'x');
        $counter = $this->counterWithImage();

        $this->actingAs($this->admin())
            ->put(route('admin.checkin-counters.update', $counter->id), [
                'nomor_counter' => '02',
                'terminal' => 'Domestik',
                'status_counter' => 'tutup',
                'idle_image' => null,
                'remove_idle_image' => true,
            ])->assertRedirect();

        $counter->refresh();
        $this->assertNull($counter->idle_image);
        Storage::disk('public')->assertMissing('checkin-counters/lama.png');
    }
}
