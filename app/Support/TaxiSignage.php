<?php

namespace App\Support;

use App\Models\Flight;
use App\Models\TaxiCounter;
use App\Models\TaxiDirection;
use App\Models\TaxiFare;
use App\Models\TaxiRunningText;
use App\Models\TaxiSetting;
use App\Models\TaxiVideo;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * Penyusun payload layar "Taxi Information & Digital Signage".
 *
 * Dipakai dua kali: sebagai props awal Inertia (agar layar langsung terisi dan
 * tetap punya konten bila jaringan putus) dan sebagai respons API polling.
 * Konten statis dan daftar penerbangan dipisah cache-nya karena beda frekuensi
 * perubahan — sama seperti pola di DisplayApiController.
 */
class TaxiSignage
{
    /** Kunci cache payload konten; dibuang oleh trait BustsTaxiCache saat data berubah. */
    public const CONTENT_CACHE_KEY = 'fids:api:taxi:content';

    /** TTL cache konten (petunjuk arah, tarif, video, running text, setting). */
    private const TTL_CONTENT = 20;

    /** TTL cache daftar penerbangan. Layar polling ~15 dtk. */
    private const TTL_FLIGHTS = 5;

    private const FLIGHTS_CACHE_KEY = 'fids:api:taxi:flights';

    /** Maksimal baris penerbangan yang muat di panel tanpa perlu digulir jauh. */
    private const FLIGHT_LIMIT = 14;

    private const FLIGHT_RELATIONS = ['airline', 'airportAsal', 'airportTujuan', 'gate'];

    /** Status yang berarti penerbangan sudah selesai dan boleh disembunyikan. */
    private const FINISHED_STATUSES = ['Departed', 'Arrived', 'Landed', 'Baggage Claim'];

    /** Penerbangan selesai tetap tampil selama ini agar penjemput sempat membaca. */
    private const LINGER_MINUTES = 30;

    public static function payload(): array
    {
        return [
            ...self::content(),
            'flights' => self::flights(),
            'server_time' => Carbon::now(DisplayTimezone::get())->toIso8601String(),
        ];
    }

    /** Bagian konten yang dikelola operator lewat panel admin. */
    public static function content(): array
    {
        $cached = Cache::remember(
            self::CONTENT_CACHE_KEY,
            self::TTL_CONTENT,
            fn () => [
                'settings' => self::settings(),
                'directions' => self::directions(),
                'counters' => self::counters(),
                'fares' => self::fares(),
                'running_texts' => self::runningTexts(),
            ],
        );

        // Video & emergency tidak ikut cache konten: keduanya bergantung waktu
        // (playlist per jam operasional, batas berlaku emergency) sehingga harus
        // dievaluasi ulang tiap permintaan.
        return [
            ...$cached,
            'videos' => self::videos(),
            'emergency' => self::emergency(),
        ];
    }

    private static function settings(): array
    {
        $s = TaxiSetting::current();

        return [
            'judul_layar' => $s->judul_layar,
            'logo_url' => self::url($s->logo_path),
            'background_url' => self::url($s->background_path),
            'warna_aksen' => $s->warna_aksen,
            'tema_warna' => $s->tema_warna,
            'video_interval_detik' => $s->video_interval_detik,
            'flight_refresh_detik' => max(5, $s->flight_refresh_detik),
            'running_text_speed' => max(10, $s->running_text_speed),
            'scroll_detik_per_layar' => max(5, $s->scroll_detik_per_layar),
            'bahasa' => $s->bahasa,
            'bahasa_switch_detik' => max(5, $s->bahasa_switch_detik),
            'tampilkan_penerbangan' => $s->tampilkan_penerbangan,
            'tampilkan_video' => $s->tampilkan_video,
            'tampilkan_tarif' => $s->tampilkan_tarif,
            'mode_hemat' => $s->mode_hemat,
        ];
    }

    private static function emergency(): ?array
    {
        $s = TaxiSetting::current();

        if (! $s->emergencyIsLive()) {
            return null;
        }

        return [
            'judul' => $s->emergency_judul ?: 'PENGUMUMAN PENTING',
            'pesan' => $s->emergency_pesan,
            'sampai' => $s->emergency_sampai?->toIso8601String(),
        ];
    }

    private static function directions(): array
    {
        return TaxiDirection::active()
            ->orderBy('order_index')
            ->get()
            ->map(fn (TaxiDirection $d) => [
                'id' => $d->id,
                'judul' => $d->judul,
                'judul_en' => $d->judul_en,
                'deskripsi' => $d->deskripsi,
                'deskripsi_en' => $d->deskripsi_en,
                'gambar_url' => self::url($d->gambar_path),
                'denah_url' => self::url($d->denah_path),
                'qr_url_gambar' => self::url($d->qr_path),
                'qr_url' => $d->qr_url,
                'jarak_meter' => $d->jarak_meter,
                'estimasi_menit' => $d->estimasi_menit,
            ])
            ->values()
            ->all();
    }

    /** Kartu counter taksi yang tampil pada panel petunjuk arah. */
    private static function counters(): array
    {
        return TaxiCounter::active()
            ->orderBy('order_index')
            ->orderBy('nomor')
            ->get()
            ->map(fn (TaxiCounter $c) => [
                'id' => $c->id,
                'nomor' => $c->nomor,
                'nama_operator' => $c->nama_operator,
                'jenis_layanan' => $c->jenis_layanan,
                'arah' => $c->arah,
            ])
            ->values()
            ->all();
    }

    private static function fares(): array
    {
        return TaxiFare::active()
            ->effectiveOn(Carbon::now(DisplayTimezone::get()))
            ->orderBy('wilayah')
            ->orderBy('order_index')
            ->orderBy('tujuan')
            ->get()
            ->map(fn (TaxiFare $f) => [
                'id' => $f->id,
                'wilayah' => $f->wilayah,
                'tujuan' => $f->tujuan,
                'jenis_kendaraan' => $f->jenis_kendaraan,
                'tarif' => $f->tarif,
                'tarif_sebelumnya' => $f->tarif_sebelumnya,
                'baru' => $f->isRecentlyChanged(),
                'berlaku_mulai' => $f->berlaku_mulai?->toDateString(),
            ])
            ->values()
            ->all();
    }

    private static function videos(): array
    {
        $now = Carbon::now(DisplayTimezone::get());

        return TaxiVideo::active()
            ->forMoment($now)
            ->orderBy('order_index')
            ->orderBy('id')
            ->get()
            ->filter(fn (TaxiVideo $v) => $v->airsOn($now))
            ->map(fn (TaxiVideo $v) => [
                'id' => $v->id,
                'judul' => $v->judul,
                'url' => self::url($v->file_path),
                'thumbnail_url' => self::url($v->thumbnail_path),
                'durasi_detik' => $v->durasi_detik,
            ])
            ->values()
            ->all();
    }

    private static function runningTexts(): array
    {
        return TaxiRunningText::active()
            ->scheduledFor(Carbon::now(DisplayTimezone::get()))
            ->orderByDesc('prioritas')
            ->orderBy('id')
            ->get()
            ->map(fn (TaxiRunningText $t) => [
                'id' => $t->id,
                'pesan' => $t->pesan,
                'pesan_en' => $t->pesan_en,
                'warna' => $t->warna,
            ])
            ->values()
            ->all();
    }

    /**
     * Penerbangan hari ini (keberangkatan + kedatangan) dari modul FIDS yang
     * sudah ada. Modul taksi hanya membaca — tidak pernah membuat data baru.
     */
    public static function flights(): array
    {
        return Cache::remember(self::FLIGHTS_CACHE_KEY, self::TTL_FLIGHTS, function () {
            $tz = DisplayTimezone::get();
            $now = Carbon::now($tz);

            return Flight::with(self::FLIGHT_RELATIONS)
                ->daily()
                ->today()
                ->orderBy('jam_jadwal')
                ->get()
                ->filter(fn (Flight $f) => self::stillRelevant($f, $now))
                ->take(self::FLIGHT_LIMIT)
                ->map(fn (Flight $f) => [
                    'id' => $f->id,
                    'nomor_penerbangan' => $f->nomor_penerbangan,
                    'jenis' => $f->jenis_penerbangan,
                    'airline' => $f->airline->nama_maskapai ?? null,
                    'airline_logo' => $f->airline?->logo ? '/storage/' . $f->airline->logo : null,
                    'kota' => $f->jenis_penerbangan === 'arrival'
                        ? ($f->airportAsal->kota ?? $f->airportAsal->nama_bandara ?? null)
                        : ($f->airportTujuan->kota ?? $f->airportTujuan->nama_bandara ?? null),
                    'jam_jadwal' => $f->jam_jadwal ? substr($f->jam_jadwal, 0, 5) : null,
                    'jam_estimasi' => $f->jam_estimasi ? substr($f->jam_estimasi, 0, 5) : null,
                    'gate' => $f->gate->nama_gate ?? $f->gate->kode_gate ?? null,
                    'status' => $f->status,
                ])
                ->values()
                ->all();
        });
    }

    /** Sembunyikan penerbangan yang sudah selesai lebih dari LINGER_MINUTES. */
    private static function stillRelevant(Flight $flight, Carbon $now): bool
    {
        if (! in_array($flight->status, self::FINISHED_STATUSES, true)) {
            return true;
        }

        $reference = $flight->updated_at?->copy()->setTimezone($now->timezone) ?? $now;

        return $now->lte($reference->addMinutes(self::LINGER_MINUTES));
    }

    private static function url(?string $path): ?string
    {
        return $path ? '/storage/' . ltrim($path, '/') : null;
    }
}
