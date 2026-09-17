<?php

namespace App\Console\Commands;

use App\Services\Metar\MetarService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Dijadwalkan tiap 30 menit. Scraping memakai request HTTP biasa (tanpa browser),
 * dan proses PHP ini selesai sendiri setelah satu kali penarikan — tidak ada
 * browser atau proses latar yang perlu ditutup dan membebani server.
 */
#[Signature('fids:fetch-metar')]
#[Description('Tarik METAR bandara dari portal aviasi BMKG untuk layar AMC')]
class FetchMetar extends Command
{
    public function handle(MetarService $service): int
    {
        $report = $service->refresh();

        if ($report === null) {
            $this->info('Penarikan METAR dinonaktifkan di Pengaturan Layar FIDS.');

            return self::SUCCESS;
        }

        if ($report->error_code !== null) {
            $this->error("METAR {$report->icao} gagal ditarik: {$report->error_message}");

            return self::FAILURE;
        }

        $this->info("METAR {$report->icao}: {$report->raw_text}");

        return self::SUCCESS;
    }
}
