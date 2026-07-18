<?php

namespace Tests\Feature;

use App\Models\Airline;
use App\Models\Airport;
use App\Models\Flight;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regresi audit: fids:archive-flights TIDAK boleh menghapus master template,
 * hanya penerbangan harian lama yang diarsipkan + dihapus.
 */
class ArchiveFlightsTest extends TestCase
{
    use RefreshDatabase;

    private function makeRefs(): array
    {
        $airline = Airline::create(['kode_maskapai' => 'GA', 'nama_maskapai' => 'Garuda']);
        $asal = Airport::create(['kode_iata' => 'AAA', 'nama_bandara' => 'Bandara A', 'kota' => 'Kota A', 'negara' => 'Indonesia']);
        $tujuan = Airport::create(['kode_iata' => 'BBB', 'nama_bandara' => 'Bandara B', 'kota' => 'Kota B', 'negara' => 'Indonesia']);

        return [$airline->id, $asal->id, $tujuan->id];
    }

    public function test_archive_deletes_old_daily_flight_but_keeps_master(): void
    {
        [$airlineId, $asalId, $tujuanId] = $this->makeRefs();

        $master = Flight::create([
            'is_master'         => true,
            'tanggal_penerbangan' => null,
            'nomor_penerbangan' => 'GA100',
            'airline_id'        => $airlineId,
            'airport_asal_id'   => $asalId,
            'airport_tujuan_id' => $tujuanId,
            'jam_jadwal'        => '08:00:00',
            'jenis_penerbangan' => 'departure',
            'tipe_layanan'      => 'domestik',
            'status'            => 'Scheduled',
        ]);

        $oldDaily = Flight::create([
            'is_master'         => false,
            'tanggal_penerbangan' => now()->subDays(5)->toDateString(),
            'nomor_penerbangan' => 'GA100',
            'airline_id'        => $airlineId,
            'airport_asal_id'   => $asalId,
            'airport_tujuan_id' => $tujuanId,
            'jam_jadwal'        => '08:00:00',
            'jenis_penerbangan' => 'departure',
            'tipe_layanan'      => 'domestik',
            'status'            => 'Departed',
        ]);

        $this->artisan('fids:archive-flights --days=1')->assertExitCode(0);

        // Master tetap ada, daily lama terhapus dan terarsip (dengan original_flight_id).
        $this->assertDatabaseHas('flights', ['id' => $master->id]);
        $this->assertDatabaseMissing('flights', ['id' => $oldDaily->id]);
        $this->assertDatabaseHas('archived_flights', [
            'original_flight_id' => $oldDaily->id,
            'nomor_penerbangan'  => 'GA100',
        ]);
    }
}
