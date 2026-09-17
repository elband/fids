<?php

namespace App\Console\Commands;

use App\Models\DisplaySetting;
use Illuminate\Console\Command;

class ReloadDisplays extends Command
{
    protected $signature = 'fids:reload-displays';

    protected $description = 'Kirim sinyal refresh ke layar publik setelah deploy';

    public function handle(): int
    {
        $setting = DisplaySetting::first();
        if (! $setting) {
            $this->warn('Pengaturan layar belum ada; sinyal refresh dilewati.');

            return self::SUCCESS;
        }

        // Token API beresolusi detik: pemanggilan berulang tetap menghasilkan token baru.
        $stamp = now();
        if ($setting->force_reload_at && $stamp->timestamp <= $setting->force_reload_at->timestamp) {
            $stamp = $setting->force_reload_at->copy()->addSecond();
        }
        $setting->force_reload_at = $stamp;
        $setting->save(); // Model membuang cache settings dan time-meta.

        $this->info('Sinyal refresh dikirim. Layar terhubung memuat ulang pada polling berikutnya.');

        return self::SUCCESS;
    }
}
