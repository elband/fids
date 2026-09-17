<?php

namespace Database\Seeders;

use App\Support\FlightStatus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Memastikan setiap status inti (FlightStatus::ALL) tersedia sebagai remark sistem,
 * karena dropdown status penerbangan hanya berisi remark aktif.
 *
 * Idempotent dan aman untuk produksi — deploy.sh menjalankannya di SETIAP deploy:
 *  - remark sistem yang sudah ada tidak diubah status aktifnya (pilihan operator
 *    dihormati), kecuali 'Scheduled' yang wajib aktif sebagai status awal;
 *  - remark lama bernama sama (beda huruf besar/kecil) diambil alih, bukan digandakan;
 *  - remark tambahan buatan operator tidak disentuh.
 */
class FlightStatusRemarkSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        foreach (FlightStatus::ALL as $status) {
            $existing = DB::table('remarks')->get(['id', 'kode', 'nama_remark', 'is_system']);
            $match = $existing->first(fn ($r) => $r->nama_remark === $status)
                ?? $existing->first(fn ($r) => strcasecmp(trim($r->nama_remark), $status) === 0);

            if ($match) {
                $changes = ['nama_remark' => $status, 'is_system' => true];
                if (! $match->is_system || $status === 'Scheduled') {
                    $changes['status_aktif'] = true;
                }
                DB::table('remarks')->where('id', $match->id)->update($changes + ['updated_at' => $now]);
                continue;
            }

            $kode = FlightStatus::DEFAULT_CODES[$status];
            $candidate = $kode;
            for ($i = 2; $existing->contains('kode', $candidate); $i++) {
                $candidate = $kode . $i;
            }

            DB::table('remarks')->insert([
                'kode' => $candidate,
                'nama_remark' => $status,
                'status_aktif' => true,
                'is_system' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
