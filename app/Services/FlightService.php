<?php

namespace App\Services;

use App\Models\Flight;
use App\Models\FlightStatusLog;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class FlightService
{
    /**
     * Update flight status and log the change.
     */
    public function updateStatus(Flight $flight, string $newStatus, ?string $notes = null): Flight
    {
        $oldStatus = $flight->status;
        
        if ($oldStatus !== $newStatus) {
            $flight->update([
                'status' => $newStatus,
                'catatan' => $notes ?? $flight->catatan,
                'updated_by' => Auth::id()
            ]);

            FlightStatusLog::create([
                'flight_id' => $flight->id,
                'status_lama' => $oldStatus,
                'status_baru' => $newStatus,
                'changed_by' => Auth::id(),
            ]);

            // Trigger Automated Announcement
            $this->triggerAnnouncement($flight, $newStatus);
        }

        return $flight;
    }

    protected function triggerAnnouncement(Flight $flight, string $status)
    {
        $flight->load(['airline', 'airportAsal', 'airportTujuan']);
        
        $isDeparture = $flight->jenis_penerbangan === 'departure';
        $locationLabel = $isDeparture ? 'tujuan' : 'dari';
        // Versi Inggris harus ikut berubah arah: kedatangan datang "from", bukan "to".
        // Sebelumnya selalu "to", sehingga pesawat yang tiba dari Jakarta diumumkan
        // sebagai "flight XX to Jakarta has landed".
        $locationLabelEn = $isDeparture ? 'to' : 'from';
        $location = $isDeparture ? ($flight->airportTujuan->kota ?? '') : ($flight->airportAsal->kota ?? '');
        $airline = $flight->airline->nama_maskapai ?? '';
        
        // Status Mapping for more natural speech
        $statusMapId = [
            'Scheduled' => 'dijadwalkan',
            'Landed' => 'telah mendarat',
            'Arrived' => 'telah tiba',
            'Delayed' => 'mengalami keterlambatan',
            'Cancelled' => 'dibatalkan',
            'Boarding' => 'telah mulai masuk ke pesawat',
            'Final Call' => 'panggilan terakhir untuk segera masuk ke pesawat',
            'Gate Closed' => 'pintu keberangkatan telah ditutup',
            'Check-in Open' => 'telah dibuka untuk lapor diri',
            'Check-in Closed' => 'lapor diri telah ditutup',
            'Departed' => 'telah berangkat',
        ];

        $statusMapEn = [
            'Scheduled' => 'is scheduled',
            'Landed' => 'has landed',
            'Arrived' => 'has arrived',
            'Delayed' => 'is delayed',
            'Cancelled' => 'is cancelled',
            'Boarding' => 'is now boarding',
            'Final Call' => 'is final call',
            'Gate Closed' => 'gate is now closed',
            'Check-in Open' => 'is now open for check-in',
            'Check-in Closed' => 'check-in is now closed',
            'Departed' => 'has departed',
        ];

        $msgId = $statusMapId[$status] ?? $status;
        $msgEn = $statusMapEn[$status] ?? "is now {$status}";

        // Indonesian Message
        $textId = "Perhatian, penerbangan {$airline} dengan nomor penerbangan {$flight->nomor_penerbangan} {$locationLabel} {$location}, {$msgId}.";
        
        // English Message
        $textEn = "Attention, {$airline} flight {$flight->nomor_penerbangan} {$locationLabelEn} {$location}, {$msgEn}.";

        \App\Models\Announcement::create([
            'judul' => "Auto: {$flight->nomor_penerbangan} - {$status}",
            'isi_pengumuman' => "{$textId} --- {$textEn}",
            'kategori' => 'Flight Status',
            'prioritas' => 1, // High Priority (Integer)
            'bahasa' => 'Indonesia',
            'target' => 'Server Speakers',
            'mode' => 'Automatic',
            'tipe' => 'pas',
            'broadcast_count' => 0,
            'max_broadcasts' => 3,
            'mulai_tayang' => now(),
            'status_aktif' => true,
        ]);

        // Trigger Client-Side Audio (handled by browser polling)
        // $fullText = "{$textId} --- {$textEn}";
        // app(\App\Services\AudioService::class)->speak($fullText, 3, 150);
    }

    /**
     * Create a new flight with initial status log.
     */
    public function createFlight(array $data): Flight
    {
        $data['created_by'] = Auth::id();
        $flight = Flight::create($data);

        FlightStatusLog::create([
            'flight_id' => $flight->id,
            'status_baru' => $flight->status,
            'changed_by' => Auth::id(),
        ]);

        return $flight;
    }

    /**
     * Sync check-in counters for a flight.
     *
     * Penugasan counter punya DUA penyimpanan yang harus selalu sejalan:
     *  - pivot `flight_checkin_counter` → sumber kebenaran, dibaca layar publik
     *    (CheckinCounter::flights() belongsToMany) dan bisa berisi >1 counter;
     *  - kolom `flights.checkin_counter_id` → warisan, masih dibaca KPI Dashboard,
     *    modul Check-in Counter, dan proses arsip (archived_flights).
     *
     * Dulu modul Keberangkatan hanya menulis pivot sementara modul Check-in Counter
     * hanya menulis kolom, sehingga penugasan yang dibuat di satu modul tidak terlihat
     * di modul lain — layar counter tetap "TUTUP" walau petugas sudah menugaskan
     * penerbangan. Selalu lewati kedua penulisan melalui metode ini.
     */
    public function syncCounters(Flight $flight, ?array $counterIds): void
    {
        if ($counterIds === null) {
            return;
        }

        $flight->checkinCounters()->sync($counterIds);
        $this->syncPrimaryCounterColumn($flight);
    }

    /**
     * Selaraskan kolom warisan `checkin_counter_id` dengan isi pivot.
     * Counter "utama" = counter bernomor terkecil (urutan numerik agar 2 < 10).
     */
    public function syncPrimaryCounterColumn(Flight $flight): void
    {
        $primary = $flight->checkinCounters()
            ->orderByRaw('CAST(nomor_counter AS UNSIGNED), nomor_counter')
            ->first();

        $flight->update(['checkin_counter_id' => $primary?->id]);
    }

    /**
     * Tugaskan satu penerbangan ke satu counter dari modul Check-in Counter.
     * Menulis pivot + kolom warisan, dan mencatat perubahan status lewat
     * updateStatus() agar tetap masuk FlightStatusLog dan memicu pengumuman.
     */
    public function assignCounter(Flight $flight, int $counterId, string $status): void
    {
        $flight->checkinCounters()->syncWithoutDetaching([$counterId]);
        $this->syncPrimaryCounterColumn($flight);
        $this->updateStatus($flight, $status);
    }

    /**
     * Lepaskan satu penerbangan dari satu counter (pivot + kolom warisan).
     *
     * @return bool  false bila penerbangan memang tidak tertaut ke counter tersebut.
     */
    public function detachCounter(Flight $flight, int $counterId, string $status): bool
    {
        $linkedViaPivot = $flight->checkinCounters()->whereKey($counterId)->exists();
        $linkedViaColumn = (int) $flight->checkin_counter_id === $counterId;

        if (! $linkedViaPivot && ! $linkedViaColumn) {
            return false;
        }

        $flight->checkinCounters()->detach($counterId);
        $this->syncPrimaryCounterColumn($flight);
        $this->updateStatus($flight, $status);

        return true;
    }

    /**
     * Generate daily operational flights from master flights for a specific date.
     */
    public function generateDailyFlights(?Carbon $date = null): int
    {
        $targetDate = $date ?? \App\Support\DisplayTimezone::today();
        
        $dayNames = [
            0 => 'Minggu', 1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu',
            4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu',
        ];
        
        $todayName = $dayNames[$targetDate->dayOfWeek];
        $masterFlights = Flight::where('is_master', true)->get();
        $generatedCount = 0;
        
        foreach ($masterFlights as $master) {
            $hariOperasi = $master->hari_operasi;
            
            // Ensure it's an array (handles JSON decoding or missing casts)
            if (is_string($hariOperasi)) {
                $hariOperasi = json_decode($hariOperasi, true);
            }
            $hariOperasi = (array) ($hariOperasi ?? []);
            
            // Check if today (by name or number) is in the operation days
            $todayNum = $targetDate->dayOfWeek; // 0=Sunday, 1=Monday...
            
            if (in_array($todayName, $hariOperasi) || in_array($todayNum, $hariOperasi)) {
                // Sertakan jam_jadwal + tujuan pada kunci dedup. Satu pesawat charter
                // (mis. PK-SNH) bisa punya beberapa rute/leg dengan nomor penerbangan
                // SAMA di hari yang sama; tanpa ini hanya leg pertama yang ter-generate.
                $exists = Flight::where('is_master', false)
                    ->whereDate('tanggal_penerbangan', $targetDate->toDateString())
                    ->where('nomor_penerbangan', $master->nomor_penerbangan)
                    ->where('jenis_penerbangan', $master->jenis_penerbangan)
                    ->where('jam_jadwal', $master->jam_jadwal)
                    ->where('airport_tujuan_id', $master->airport_tujuan_id)
                    ->exists();
                    
                if (!$exists) {
                    $newFlight = $master->replicate();
                    $newFlight->is_master = false;
                    $newFlight->tanggal_penerbangan = $targetDate;
                    $newFlight->status = 'Scheduled';
                    $newFlight->jam_estimasi = null;
                    $newFlight->jam_aktual = null;
                    $newFlight->save();
                    
                    $newFlight->checkinCounters()->sync($master->checkinCounters->pluck('id'));
                    $generatedCount++;
                }
            }
        }

        return $generatedCount;
    }
}
