<?php

namespace Tests\Feature;

use App\Models\Airline;
use App\Models\Airport;
use App\Models\Flight;
use App\Models\Gate;
use App\Support\DisplayTimezone;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regresi aturan operasional Boarding Gate:
 *  - Penerbangan muncul mulai 1 jam sebelum jam jadwal.
 *  - Semua penerbangan yang lolos ikut tampil; elemen pertama adalah penghuni
 *    gate (dipilih prioritas status), sisanya antrian terurut jam jadwal.
 *  - Departed hilang setelah 15 menit jika ada penerbangan berikutnya, selain itu 60 menit.
 */
class BoardingGateRuleTest extends TestCase
{
    use RefreshDatabase;

    private string $tz;
    private Carbon $now;
    private int $airlineId;
    private int $asalId;
    private int $tujuanId;
    private int $gateId;
    private string $gateCode = 'G9';

    protected function setUp(): void
    {
        parent::setUp();

        // Pakai tz yang sama dengan controller agar perbandingan waktu selaras.
        $this->tz = DisplayTimezone::get();
        $this->now = Carbon::parse('2026-07-19 10:00:00', $this->tz);
        Carbon::setTestNow($this->now);

        $this->airlineId = Airline::create(['kode_maskapai' => 'IU', 'nama_maskapai' => 'Super Air Jet'])->id;
        $this->asalId = Airport::create(['kode_iata' => 'AAP', 'nama_bandara' => 'APT Pranoto', 'kota' => 'Samarinda', 'negara' => 'Indonesia'])->id;
        $this->tujuanId = Airport::create(['kode_iata' => 'SUB', 'nama_bandara' => 'Juanda', 'kota' => 'Surabaya', 'negara' => 'Indonesia'])->id;
        $this->gateId = Gate::create(['kode_gate' => $this->gateCode, 'nama_gate' => 'Gate ' . $this->gateCode, 'terminal' => 'T1'])->id;
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function makeFlight(string $nomor, string $jamJadwal, string $status = 'Scheduled', ?string $jamAktual = null): Flight
    {
        return Flight::create([
            'is_master'         => false,
            'tanggal_penerbangan' => $this->now->toDateString(),
            'nomor_penerbangan' => $nomor,
            'airline_id'        => $this->airlineId,
            'airport_asal_id'   => $this->asalId,
            'airport_tujuan_id' => $this->tujuanId,
            'jenis_penerbangan' => 'departure',
            'tipe_layanan'      => 'domestik',
            'jam_jadwal'        => $jamJadwal,
            'jam_aktual'        => $jamAktual,
            'status'            => $status,
            'gate_id'           => $this->gateId,
        ]);
    }

    private function gateFlights(): array
    {
        return $this->getJson("/api/fids/gate/{$this->gateCode}")
            ->assertOk()
            ->json('data.flights') ?? [];
    }

    private function gateUpcoming(): ?array
    {
        return $this->getJson("/api/fids/gate/{$this->gateCode}")
            ->assertOk()
            ->json('data.upcoming_flight');
    }

    public function test_flight_appears_only_within_one_hour_before_schedule(): void
    {
        // 10:30 → jendela buka 09:30, sekarang 10:00 → tampil.
        $this->makeFlight('IU100', '10:30:00');
        // 12:30 → jendela buka 11:30, sekarang 10:00 → belum tampil.
        $this->makeFlight('IU200', '12:30:00');

        $flights = $this->gateFlights();

        $this->assertCount(1, $flights);
        $this->assertSame('IU100', $flights[0]['nomor_penerbangan']);
    }

    public function test_flight_more_than_one_hour_before_is_hidden(): void
    {
        $this->makeFlight('IU300', '11:30:00'); // jendela buka 10:30 > sekarang 10:00
        $this->assertCount(0, $this->gateFlights());
    }

    public function test_checkin_open_appears_regardless_of_lead_window(): void
    {
        // Check-in dibuka pukul 10:00 untuk penerbangan 15:00 — jendela 1 jam belum
        // terbuka, tapi penumpang sudah diarahkan ke gate, jadi gate harus terisi.
        $this->makeFlight('IU400', '15:00:00', 'Check-in Open');

        $flights = $this->gateFlights();

        $this->assertCount(1, $flights);
        $this->assertSame('IU400', $flights[0]['nomor_penerbangan']);
    }

    public function test_boarding_appears_regardless_of_lead_window(): void
    {
        $this->makeFlight('IU500', '14:00:00', 'Boarding');
        $this->assertCount(1, $this->gateFlights());
    }

    public function test_departed_with_next_flight_hides_at_15_minutes(): void
    {
        $this->makeFlight('IU400', '09:00:00', 'Departed', '09:45:00');
        $this->makeFlight('IU401', '15:00:00');
        Carbon::setTestNow($this->now->copy()->subSecond());
        $this->assertCount(1, $this->gateFlights());
        Carbon::setTestNow($this->now);
        \Illuminate\Support\Facades\Cache::flush();
        $this->assertCount(0, $this->gateFlights());
        $this->assertSame('IU401', $this->gateUpcoming()['nomor_penerbangan']);
        $this->getJson('/api/fids/gates')->assertOk()->assertJsonCount(0, 'data.0.flights');
    }

    public function test_last_departed_flight_hides_at_60_minutes(): void
    {
        $this->makeFlight('IU500', '08:30:00', 'Departed', '09:00:00');
        Carbon::setTestNow($this->now->copy()->subSecond());
        $this->assertCount(1, $this->gateFlights());
        Carbon::setTestNow($this->now);
        \Illuminate\Support\Facades\Cache::flush();
        $this->assertCount(0, $this->gateFlights());
        $this->assertNull($this->gateUpcoming());
    }

    public function test_cancelled_or_other_gate_flight_does_not_shorten_linger(): void
    {
        $this->makeFlight('IU510', '09:00:00', 'Departed', '09:40:00');
        $this->makeFlight('IU511', '15:00:00', 'Cancelled');
        $otherGate = Gate::create(['kode_gate' => 'G8', 'nama_gate' => 'Gate G8', 'terminal' => 'T1']);
        $this->makeFlight('IU512', '15:00:00')->update(['gate_id' => $otherGate->id]);
        $this->assertSame(['IU510'], array_column($this->gateFlights(), 'nomor_penerbangan'));
    }

    public function test_departed_without_actual_time_uses_update_time(): void
    {
        $flight = $this->makeFlight('IU520', '09:00:00', 'Departed');
        $this->makeFlight('IU521', '15:00:00');
        $this->assertCount(1, $this->gateFlights());
        Carbon::setTestNow($this->now->copy()->addMinutes(15));
        \Illuminate\Support\Facades\Cache::flush();
        $this->assertCount(0, $this->gateFlights());
    }

    public function test_all_eligible_flights_are_listed_earliest_first(): void
    {
        $this->makeFlight('IU610', '10:45:00'); // jendela buka 09:45 → eligible
        $this->makeFlight('IU600', '10:15:00'); // jendela buka 09:15 → eligible & lebih awal

        $flights = $this->gateFlights();

        // Keduanya terdaftar di gate yang sama, jadi keduanya harus terlihat
        // penumpang — bukan hanya yang paling awal.
        $this->assertCount(2, $flights);
        $this->assertSame(['IU600', 'IU610'], array_column($flights, 'nomor_penerbangan'));
    }

    public function test_boarding_flight_outranks_earlier_delayed_flight(): void
    {
        // Kasus yang dulu salah: jam jadwal lebih awal tetapi ditunda, sementara
        // penerbangan berikutnya sudah benar-benar boarding di gate tersebut.
        $this->makeFlight('IU700', '10:15:00', 'Delayed');
        $this->makeFlight('IU710', '10:45:00', 'Boarding');

        $flights = $this->gateFlights();

        $this->assertCount(2, $flights);
        $this->assertSame('IU710', $flights[0]['nomor_penerbangan'], 'penghuni gate harus yang sedang boarding');
    }

    public function test_empty_gate_announces_next_scheduled_flight(): void
    {
        // 15:00 masih jauh di luar jendela 60 menit, jadi gate tetap kosong —
        // tapi jamnya berguna bagi penumpang yang berdiri di depan gate.
        $this->makeFlight('IU900', '15:00:00');

        $this->assertCount(0, $this->gateFlights());
        $this->assertSame('IU900', $this->gateUpcoming()['nomor_penerbangan'] ?? null);
    }

    public function test_occupied_gate_does_not_repeat_next_flight(): void
    {
        // Gate terisi: antrian sudah tampil di daftar "BERIKUTNYA", jadi
        // upcoming_flight harus kosong agar informasinya tidak dobel.
        $this->makeFlight('IU910', '10:30:00');
        $this->makeFlight('IU920', '15:00:00');

        $this->assertCount(1, $this->gateFlights());
        $this->assertNull($this->gateUpcoming());
    }

    public function test_gate_without_any_remaining_flight_has_no_next(): void
    {
        // Sudah berangkat lebih dari 60 menit lalu: gate kosong dan memang tidak
        // ada lagi jadwal berikutnya hari ini.
        $this->makeFlight('IU930', '08:00:00', 'Departed', '08:50:00');

        $this->assertCount(0, $this->gateFlights());
        $this->assertNull($this->gateUpcoming());
    }

    public function test_queue_after_occupant_is_sorted_by_schedule(): void
    {
        // Antrian dibaca penumpang sebagai urutan waktu, jadi setelah penghuni
        // gate ditentukan, sisanya harus urut jam — bukan urut prioritas status.
        $this->makeFlight('IU800', '10:50:00', 'Boarding');       // penghuni
        $this->makeFlight('IU810', '10:40:00', 'Check-in Open');
        $this->makeFlight('IU820', '10:20:00', 'Delayed');
        $this->makeFlight('IU830', '10:55:00');                   // Scheduled

        $flights = $this->gateFlights();

        $this->assertSame(
            ['IU800', 'IU820', 'IU810', 'IU830'],
            array_column($flights, 'nomor_penerbangan')
        );
    }
}
