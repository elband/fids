<?php

namespace App\Services\Metar;

use Carbon\CarbonImmutable;
use GuzzleHttp\Cookie\CookieJar;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * Mengambil METAR terbaru satu stasiun dari portal aviasi BMKG
 * (web-aviation.bmkg.go.id/web/metar_speci.php).
 *
 * Portal ini tidak punya API: datanya hanya keluar lewat formulir POST yang
 * dilindungi token CSRF + cookie sesi. Karena itu cukup dua request HTTP biasa
 * (GET formulir, POST pencarian) — tanpa browser/headless Chrome, jadi tidak ada
 * proses yang tertinggal di server. Cookie jar dibuat baru setiap penarikan dan
 * dibuang begitu method ini selesai.
 */
class BmkgAviationMetarScraper
{
    /** Batas waktu per request; total satu penarikan maksimal ±50 detik. */
    private const TIMEOUT_SECONDS = 20;
    private const CONNECT_TIMEOUT_SECONDS = 8;

    private const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    /**
     * @return array<string, mixed> hasil MetarParser::parse() untuk laporan terbaru.
     *
     * @throws MetarFetchException dengan alasan yang siap ditampilkan.
     */
    public function fetchLatest(string $url, string $icao, ?CarbonImmutable $now = null): array
    {
        $now ??= CarbonImmutable::now('UTC');
        $icao = strtoupper(trim($icao));
        $url = trim($url);

        if (! preg_match('/^[A-Z]{4}$/', $icao)) {
            throw new MetarFetchException(MetarFetchException::KONFIGURASI, "Kode ICAO \"{$icao}\" tidak valid. Isi 4 huruf, mis. WALS, di Pengaturan Layar FIDS.");
        }
        if (! filter_var($url, FILTER_VALIDATE_URL) || ! preg_match('#^https?://#i', $url)) {
            throw new MetarFetchException(MetarFetchException::KONFIGURASI, 'Alamat web METAR belum diisi atau tidak valid di Pengaturan Layar FIDS.');
        }

        $host = parse_url($url, PHP_URL_HOST);
        $client = $this->client(new CookieJar());

        $form = $this->send($host, fn () => $client->get($url));
        if (! preg_match('/name="_token"\s+value="([^"]+)"/', $form->body(), $m)) {
            throw new MetarFetchException(MetarFetchException::STRUKTUR, "Formulir METAR di {$host} tidak ditemukan (token tidak ada). Tampilan situs BMKG kemungkinan berubah atau alamat web salah.");
        }

        $result = $this->send($host, fn () => $client
            ->withHeaders(['Referer' => $url])
            ->asForm()
            ->post($url, [
                '_token' => $m[1],
                'stasiun' => $icao,
                // Jendela lebar: portal tidak menjelaskan zona waktu isian ini.
                'from' => $now->subHours(12)->format('Y-m-d\TH:i'),
                'to' => $now->addHours(12)->format('Y-m-d\TH:i'),
                'metar' => 'SA',
                'speci' => 'SP',
            ]));

        return $this->latestReport($result->body(), $icao, $host, $now);
    }

    private function client(CookieJar $jar): PendingRequest
    {
        return Http::withOptions(['cookies' => $jar])
            ->timeout(self::TIMEOUT_SECONDS)
            ->connectTimeout(self::CONNECT_TIMEOUT_SECONDS)
            ->withHeaders([
                'User-Agent' => self::USER_AGENT,
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language' => 'id-ID,id;q=0.9,en;q=0.8',
            ]);
    }

    /** Menjalankan request dan menerjemahkan kegagalan menjadi alasan yang jelas. */
    private function send(string $host, callable $request): Response
    {
        try {
            /** @var Response $response */
            $response = $request();
        } catch (ConnectionException $e) {
            $detail = $e->getMessage();
            $reason = match (true) {
                str_contains($detail, 'timed out') || str_contains($detail, 'cURL error 28') => "server {$host} tidak merespons dalam " . self::TIMEOUT_SECONDS . ' detik (timeout)',
                str_contains($detail, 'resolve host') || str_contains($detail, 'cURL error 6') => "nama domain {$host} tidak dapat ditemukan (DNS / internet server FIDS bermasalah)",
                str_contains($detail, 'SSL') || str_contains($detail, 'certificate') => "sertifikat SSL {$host} bermasalah",
                default => "koneksi ke {$host} gagal",
            };

            throw new MetarFetchException(MetarFetchException::KONEKSI, "Tidak dapat terhubung: {$reason}.");
        }

        $status = $response->status();
        if ($status === 403 || $status === 429) {
            throw new MetarFetchException(MetarFetchException::DIBLOKIR, "Akses ke {$host} ditolak (HTTP {$status}). IP server FIDS kemungkinan diblokir firewall/Cloudflare BMKG atau terlalu sering meminta data.");
        }
        if ($status === 419) {
            throw new MetarFetchException(MetarFetchException::STRUKTUR, "Sesi formulir {$host} ditolak (HTTP 419). Situs BMKG kemungkinan mengubah pengamanan formulirnya.");
        }
        if (! $response->successful()) {
            throw new MetarFetchException(MetarFetchException::HTTP, "Server {$host} merespons HTTP {$status}" . ($status >= 500 ? ' (gangguan di sisi BMKG).' : '.'));
        }

        return $response;
    }

    /** @return array<string, mixed> */
    private function latestReport(string $html, string $icao, string $host, CarbonImmutable $now): array
    {
        $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5);
        preg_match_all('/\b(?:METAR|SPECI)(?: COR)? ' . $icao . ' \d{6}Z[^=]*=/', $text, $matches);

        if (empty($matches[0])) {
            throw new MetarFetchException(MetarFetchException::KOSONG, "Tidak ada laporan METAR untuk {$icao} di {$host} dalam 12 jam terakhir. Periksa kode ICAO atau stasiun sedang tidak mengirim laporan.");
        }

        $latest = null;
        foreach (array_unique($matches[0]) as $raw) {
            try {
                $parsed = MetarParser::parse($raw, $now);
            } catch (MetarFetchException) {
                continue;
            }
            // Laporan SPECI/koreksi dengan jam yang sama menggantikan yang lebih dulu tampil.
            if ($latest === null || $parsed['observed_at']->greaterThanOrEqualTo($latest['observed_at'])) {
                $latest = $parsed;
            }
        }

        if ($latest === null) {
            throw new MetarFetchException(MetarFetchException::FORMAT, "Laporan METAR {$icao} ditemukan tetapi formatnya tidak dapat dibaca.");
        }

        return $latest;
    }
}
