<?php

namespace Tests\Feature;

use App\Models\Airline;
use App\Models\Airport;
use App\Models\Flight;
use App\Models\Remark;
use App\Models\User;
use App\Support\DisplayTimezone;
use App\Support\FlightStatus;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Master Remark adalah sumber daftar status penerbangan: dropdown, validasi
 * simpan, dan API transaksi semuanya harus mengikuti tabel `remarks`.
 */
class RemarkFlightStatusTest extends TestCase
{
    use RefreshDatabase;

    private Carbon $now;
    private int $airlineId;
    private int $asalId;
    private int $tujuanId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->now = Carbon::parse('2026-07-19 10:00:00', DisplayTimezone::get());
        Carbon::setTestNow($this->now);

        $this->airlineId = Airline::create(['kode_maskapai' => 'IU', 'nama_maskapai' => 'Super Air Jet'])->id;
        $this->asalId = Airport::create(['kode_iata' => 'AAP', 'nama_bandara' => 'APT Pranoto', 'kota' => 'Samarinda', 'negara' => 'Indonesia'])->id;
        $this->tujuanId = Airport::create(['kode_iata' => 'SUB', 'nama_bandara' => 'Juanda', 'kota' => 'Surabaya', 'negara' => 'Indonesia'])->id;

        Role::findOrCreate('Super Admin');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function operator(): User
    {
        return User::factory()->create(['email_verified_at' => now()])->assignRole('Super Admin');
    }

    private function makeFlight(array $overrides = []): Flight
    {
        return Flight::create(array_merge([
            'is_master'           => false,
            'tanggal_penerbangan' => $this->now->toDateString(),
            'nomor_penerbangan'   => 'IU641',
            'airline_id'          => $this->airlineId,
            'airport_asal_id'     => $this->asalId,
            'airport_tujuan_id'   => $this->tujuanId,
            'jenis_penerbangan'   => 'departure',
            'tipe_layanan'        => 'domestik',
            'jam_jadwal'          => '10:30:00',
            'status'              => 'Scheduled',
        ], $overrides));
    }

    private function dailyPayload(string $status): array
    {
        return [
            'tanggal_penerbangan' => $this->now->toDateString(),
            'nomor_penerbangan'   => 'IU641',
            'airline_id'          => $this->airlineId,
            'airport_asal_id'     => $this->asalId,
            'airport_tujuan_id'   => $this->tujuanId,
            'jam_jadwal'          => '10:30',
            'tipe_layanan'        => 'domestik',
            'status'              => $status,
        ];
    }

    public function test_migration_seeds_every_core_status_as_system_remark(): void
    {
        foreach (FlightStatus::ALL as $status) {
            $remark = Remark::where('nama_remark', $status)->first();
            $this->assertNotNull($remark, "Remark {$status} tidak ada");
            $this->assertTrue($remark->is_system);
            $this->assertTrue($remark->status_aktif);
        }
    }

    public function test_daily_departure_page_receives_active_remarks_as_status_options(): void
    {
        Remark::create(['kode' => 'DIV', 'nama_remark' => 'Diverted', 'status_aktif' => true]);
        Remark::where('nama_remark', 'Gate Closed')->update(['status_aktif' => false]);

        $this->actingAs($this->operator())
            ->get(route('admin.daily-departures.index'))
            ->assertInertia(fn ($page) => $page
                ->where('statusOptions', function ($options) {
                    $options = collect($options)->all();

                    return $options[0] === 'Scheduled'
                        && in_array('Diverted', $options, true)
                        && ! in_array('Gate Closed', $options, true)
                        && end($options) === 'Diverted';
                }));
    }

    public function test_daily_update_accepts_active_remark_and_rejects_unknown_or_inactive(): void
    {
        $flight = $this->makeFlight();
        $user = $this->operator();
        Remark::where('nama_remark', 'Gate Closed')->update(['status_aktif' => false]);

        $this->actingAs($user)
            ->put(route('admin.daily-departures.update', $flight), $this->dailyPayload('Boarding'))
            ->assertSessionHasNoErrors();
        $this->assertSame('Boarding', $flight->fresh()->status);

        foreach (['Ngawur', 'boarding', 'Gate Closed'] as $invalid) {
            $this->actingAs($user)
                ->put(route('admin.daily-departures.update', $flight), $this->dailyPayload($invalid))
                ->assertSessionHasErrors('status');
        }
        $this->assertSame('Boarding', $flight->fresh()->status);
    }

    public function test_flight_keeps_its_current_status_even_after_remark_is_deactivated(): void
    {
        $flight = $this->makeFlight(['status' => 'Delayed']);
        Remark::where('nama_remark', 'Delayed')->update(['status_aktif' => false]);

        $this->actingAs($this->operator())
            ->put(route('admin.daily-departures.update', $flight), $this->dailyPayload('Delayed'))
            ->assertSessionHasNoErrors();
    }

    public function test_system_remark_cannot_be_renamed_or_deleted(): void
    {
        $remark = Remark::where('nama_remark', 'Boarding')->first();
        $user = $this->operator();

        $this->actingAs($user)
            ->put(route('admin.remarks.update', $remark), ['kode' => 'BRD', 'nama_remark' => 'Naik Pesawat', 'status_aktif' => true])
            ->assertSessionHasErrors('nama_remark');

        $this->actingAs($user)->delete(route('admin.remarks.destroy', $remark));
        $this->assertSame('Boarding', $remark->fresh()?->nama_remark);

        $scheduled = Remark::where('nama_remark', 'Scheduled')->first();
        $this->actingAs($user)
            ->put(route('admin.remarks.update', $scheduled), ['kode' => $scheduled->kode, 'nama_remark' => 'Scheduled', 'status_aktif' => false])
            ->assertSessionHasErrors('status_aktif');
    }

    public function test_renaming_custom_remark_updates_flights_and_in_use_remark_cannot_be_deleted(): void
    {
        $remark = Remark::create(['kode' => 'DIV', 'nama_remark' => 'Diverted', 'status_aktif' => true]);
        $flight = $this->makeFlight(['status' => 'Diverted']);
        $user = $this->operator();

        $this->actingAs($user)
            ->put(route('admin.remarks.update', $remark), ['kode' => 'DIV', 'nama_remark' => 'Dialihkan', 'status_aktif' => true])
            ->assertSessionHasNoErrors();
        $this->assertSame('Dialihkan', $flight->fresh()->status);

        $this->actingAs($user)->delete(route('admin.remarks.destroy', $remark))->assertSessionHas('error');
        $this->assertNotNull($remark->fresh());
    }

    public function test_transaksi_api_exposes_remark_id(): void
    {
        $this->makeFlight(['status' => 'Boarding']);
        $id = Remark::where('nama_remark', 'Boarding')->value('id');

        $this->getJson('/api/transaksi/keberangkatan')
            ->assertOk()
            ->assertJsonPath('data.result.data.0.remark_id', $id)
            ->assertJsonPath('data.result.data.0.remark.id', $id);
    }
}
