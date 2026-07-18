<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use App\Models\Flight;
use App\Models\ArchivedFlight;
use App\Models\DailyResetLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

#[Signature('fids:archive-flights {--days=1 : Arsipkan penerbangan lebih lama dari N hari}')]
#[Description('Arsipkan penerbangan lama ke tabel archived_flights dan hapus dari tabel aktif')]
class ArchiveFlightsCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = (int) $this->option('days');
        $cutoffDate = Carbon::today()->subDays($days);
        
        $this->info("Mengarsipkan penerbangan sebelum {$cutoffDate->toDateString()}...");

        $flights = Flight::where('tanggal_penerbangan', '<', $cutoffDate)->get();

        if ($flights->isEmpty()) {
            $this->info('Tidak ada penerbangan yang perlu diarsipkan.');
            return Command::SUCCESS;
        }

        $archivedCount = 0;
        
        DB::beginTransaction();
        try {
            foreach ($flights as $flight) {
                ArchivedFlight::create([
                    'nomor_penerbangan' => $flight->nomor_penerbangan,
                    'airline_id' => $flight->airline_id,
                    'airport_asal_id' => $flight->airport_asal_id,
                    'airport_tujuan_id' => $flight->airport_tujuan_id,
                    'tanggal_penerbangan' => $flight->tanggal_penerbangan,
                    'jam_jadwal' => $flight->jam_jadwal,
                    'jam_estimasi' => $flight->jam_estimasi,
                    'jam_aktual' => $flight->jam_aktual,
                    'jenis_penerbangan' => $flight->jenis_penerbangan,
                    'tipe_layanan' => $flight->tipe_layanan,
                    'status' => $flight->status,
                    'gate_id' => $flight->gate_id,
                    'checkin_counter_id' => $flight->checkin_counter_id,
                    'baggage_claim_id' => $flight->baggage_claim_id,
                    'catatan' => $flight->catatan,
                    'created_by' => $flight->created_by,
                    'archived_at' => Carbon::now(),
                ]);

                $flight->delete();
                $archivedCount++;
            }

            DailyResetLog::create([
                'tanggal_reset' => Carbon::now(),
                'jumlah_diarsipkan' => $archivedCount,
                'status' => 'success',
                'catatan' => "Berhasil mengarsipkan {$archivedCount} penerbangan sebelum {$cutoffDate->toDateString()}.",
            ]);

            DB::commit();
            $this->info("✅ Berhasil mengarsipkan {$archivedCount} penerbangan.");
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            DailyResetLog::create([
                'tanggal_reset' => Carbon::now(),
                'jumlah_diarsipkan' => 0,
                'status' => 'failed',
                'catatan' => "Gagal: " . $e->getMessage(),
            ]);

            $this->error("❌ Gagal mengarsipkan: " . $e->getMessage());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}
