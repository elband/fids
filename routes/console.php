<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('fids:archive-flights --days=1')->dailyAt('00:01');
Schedule::command('fids:generate-daily-flights')->dailyAt('01:00');
Schedule::command('fids:fetch-weather')->everyThirtyMinutes();
