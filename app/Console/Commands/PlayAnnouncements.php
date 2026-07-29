<?php

namespace App\Console\Commands;

use App\Models\Announcement;
use App\Services\AudioService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Pemutar PAS sisi server untuk pengumuman bertarget "Server Speakers".
 *
 * Sebelum ini, pengumuman otomatis dari FlightService hanya tersimpan sebagai
 * baris DB dan menunggu ada browser (layar publik / panel admin) yang memutarnya.
 * Bila tidak ada tab terbuka, broadcast_count tak pernah naik sehingga pengumuman
 * tidak pernah mencapai max_broadcasts dan tidak pernah dibersihkan.
 *
 * Command ini dijadwalkan tiap menit dan memutar SATU pengumuman per jalannya
 * (prioritas tertinggi lebih dulu), agar suara tidak saling tumpang tindih.
 */
class PlayAnnouncements extends Command
{
    protected $signature = 'fids:play-announcements
                            {--force : Putar walau config fids.pas.server_speaker mati}';

    protected $description = 'Putar pengumuman PAS yang tertunda lewat speaker server';

    public function handle(AudioService $audio): int
    {
        if (! config('fids.pas.server_speaker') && ! $this->option('force')) {
            $this->comment('Pemutar server nonaktif (FIDS_PAS_SERVER_SPEAKER=false). Dilewati.');
            return self::SUCCESS;
        }

        $announcement = $this->nextPending();

        if (! $announcement) {
            $this->info('Tidak ada pengumuman tertunda.');
            return self::SUCCESS;
        }

        // Klaim atomik: syarat waktu diulang di dalam UPDATE supaya dua proses
        // (run yang tumpang tindih, atau browser yang melapor bersamaan) tidak
        // menaikkan hitungan dua kali untuk satu siklus pemutaran yang sama.
        $claimed = Announcement::where('id', $announcement->id)
            ->where('status_aktif', true)
            ->whereColumn('broadcast_count', '<', 'max_broadcasts')
            ->where(function ($q) use ($announcement) {
                $q->whereNull('last_broadcast_at')
                  ->orWhere('last_broadcast_at', '<=', $this->readyAt($announcement));
            })
            ->update([
                'broadcast_count'   => DB::raw('broadcast_count + 1'),
                'last_broadcast_at' => now(),
            ]);

        if (! $claimed) {
            $this->comment("Dilewati: #{$announcement->id} sudah diklaim proses lain.");
            return self::SUCCESS;
        }

        $audio->speak((string) $announcement->isi_pengumuman, 1);

        $announcement->refresh();
        $this->info("Diputar #{$announcement->id} \"{$announcement->judul}\" ({$announcement->broadcast_count}/{$announcement->max_broadcasts}).");

        // Batas tercapai: nonaktifkan agar keluar dari antrian. Penghapusan permanen
        // tetap dilakukan proses admin (PublicAnnouncementController@index).
        if ($announcement->broadcast_count >= $announcement->max_broadcasts) {
            $announcement->update(['status_aktif' => false]);
            $this->info("Selesai: #{$announcement->id} mencapai batas pemutaran, dinonaktifkan.");
        }

        Cache::forget('fids:api:announcements');

        return self::SUCCESS;
    }

    /**
     * Pengumuman tertunda berikutnya: aktif, belum mencapai batas, dan
     * interval_pemutaran sejak pemutaran terakhir sudah terlewati.
     *
     * Penyaringan interval dilakukan di PHP, bukan lewat DATE_SUB(...) mentah,
     * agar tidak terikat MySQL (suite pengujian memakai SQLite).
     */
    private function nextPending(): ?Announcement
    {
        $targets = config('fids.pas.server_speaker_targets');

        return Announcement::where('status_aktif', true)
            ->whereColumn('broadcast_count', '<', 'max_broadcasts')
            ->when(is_array($targets) && $targets !== [], fn ($q) => $q->whereIn('target', $targets))
            ->orderByDesc('prioritas')
            ->orderBy('created_at')
            ->get()
            ->first(fn (Announcement $a) => $a->last_broadcast_at === null
                || $a->last_broadcast_at->lessThanOrEqualTo($this->readyAt($a)));
    }

    /**
     * Batas waktu "boleh diputar lagi": sekarang dikurangi interval_pemutaran
     * (default 1 menit bila kosong).
     */
    private function readyAt(Announcement $announcement): \Illuminate\Support\Carbon
    {
        return now()->subMinutes(max(1, (int) ($announcement->interval_pemutaran ?: 1)));
    }
}
