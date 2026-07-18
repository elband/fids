<?php

namespace Tests\Feature;

use App\Models\Airline;
use App\Models\Airport;
use App\Models\Flight;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Regresi: edit master keberangkatan/kedatangan (tanggal null) tidak boleh
 * gagal validasi "tanggal_penerbangan must be a valid date" saat nilai kosong/'-'.
 */
class MasterFlightUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::create(['name' => 'Super Admin']);
    }

    private function refs(): array
    {
        $airline = Airline::create(['kode_maskapai' => 'IU', 'nama_maskapai' => 'Super Air Jet']);
        $sub = Airport::create(['kode_iata' => 'SUB', 'nama_bandara' => 'Juanda', 'kota' => 'Surabaya', 'negara' => 'Indonesia']);
        $aap = Airport::create(['kode_iata' => 'AAP', 'nama_bandara' => 'APT Pranoto', 'kota' => 'Samarinda', 'negara' => 'Indonesia']);
        return [$airline->id, $sub->id, $aap->id];
    }

    private function masterFlight(string $jenis, int $airlineId, int $asalId, int $tujuanId): Flight
    {
        return Flight::create([
            'is_master' => true,
            'tanggal_penerbangan' => null,
            'nomor_penerbangan' => 'IU652',
            'airline_id' => $airlineId,
            'airport_asal_id' => $asalId,
            'airport_tujuan_id' => $tujuanId,
            'jenis_penerbangan' => $jenis,
            'tipe_layanan' => 'domestik',
            'jam_jadwal' => '11:50',
            'status' => 'Scheduled',
            'hari_operasi' => ['Senin'],
        ]);
    }

    public function test_master_arrival_update_accepts_dash_date(): void
    {
        [$airlineId, $subId, $aapId] = $this->refs();
        $flight = $this->masterFlight('arrival', $airlineId, $subId, $aapId);
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole('Super Admin');

        $resp = $this->actingAs($user)->put(route('admin.arrivals.update', $flight->id), [
            'tanggal_penerbangan' => '-',          // nilai bermasalah dari form master
            'nomor_penerbangan'   => 'IU652',
            'airline_id'          => $airlineId,
            'airport_asal_id'     => $subId,
            'airport_tujuan_id'   => $aapId,
            'jam_jadwal'          => '11:50',
            'tipe_layanan'        => 'domestik',
            'hari_operasi'        => ['Senin', 'Selasa'],
            'status'              => 'Scheduled',
        ]);

        $resp->assertSessionHasNoErrors();
        $this->assertNull($flight->fresh()->tanggal_penerbangan);
    }

    public function test_master_departure_update_accepts_empty_date(): void
    {
        [$airlineId, $subId, $aapId] = $this->refs();
        $flight = $this->masterFlight('departure', $airlineId, $aapId, $subId);
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole('Super Admin');

        $resp = $this->actingAs($user)->put(route('admin.departures.update', $flight->id), [
            'tanggal_penerbangan' => '',
            'nomor_penerbangan'   => 'IU652',
            'airline_id'          => $airlineId,
            'airport_asal_id'     => $aapId,
            'airport_tujuan_id'   => $subId,
            'jam_jadwal'          => '12:30',
            'tipe_layanan'        => 'domestik',
            'hari_operasi'        => ['Senin'],
            'status'              => 'Scheduled',
        ]);

        $resp->assertSessionHasNoErrors();
        $this->assertNull($flight->fresh()->tanggal_penerbangan);
    }
}
