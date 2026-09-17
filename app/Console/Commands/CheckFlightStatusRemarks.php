<?php

namespace App\Console\Commands;

use App\Models\Remark;
use App\Support\FlightStatus;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Dipanggil deploy.sh setelah seeding: gagal (exit 1) bila ada status inti yang
 * belum tersimpan sebagai remark sistem, supaya deploy tidak "sukses" dengan
 * dropdown status penerbangan yang tidak lengkap.
 */
#[Signature('fids:check-flight-status-remarks')]
#[Description('Pastikan setiap status penerbangan inti tersedia sebagai remark sistem')]
class CheckFlightStatusRemarks extends Command
{
    public function handle(): int
    {
        $system = Remark::where('is_system', true)->pluck('nama_remark')->all();
        $missing = array_values(array_diff(FlightStatus::ALL, $system));

        if ($missing !== []) {
            $this->error('Remark status inti belum lengkap: ' . implode(', ', $missing));

            return self::FAILURE;
        }

        $this->info('Remark status penerbangan lengkap (' . count(FlightStatus::ALL) . ' status inti).');

        return self::SUCCESS;
    }
}
