<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('fids:archive-flights --days=1')->dailyAt('00:01')->withoutOverlapping();
Schedule::command('fids:generate-daily-flights')->dailyAt('01:00')->withoutOverlapping();
Schedule::command('fids:fetch-weather')->everyThirtyMinutes()->withoutOverlapping();
// METAR bandara (scraping portal aviasi BMKG, tanpa browser). Kunci overlap
// kedaluwarsa 10 menit supaya proses yang macet tidak menahan jadwal berikutnya.
Schedule::command('fids:fetch-metar')->everyThirtyMinutes()->withoutOverlapping(10);

// Pemutar PAS sisi server. Command-nya keluar cepat bila FIDS_PAS_SERVER_SPEAKER
// tidak diaktifkan, jadi aman dijadwalkan tiap menit di instalasi mana pun.
Schedule::command('fids:play-announcements')->everyMinute()->withoutOverlapping();
