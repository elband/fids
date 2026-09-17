<?php

namespace App\Services\Metar;

use Carbon\CarbonImmutable;

/**
 * Parser METAR/SPECI format ICAO (WMO FM 15) untuk kebutuhan layar AMC.
 *
 * Hanya bagian pengamatan utama yang diurai; bagian TEMPO/BECMG/NOSIG disimpan
 * utuh sebagai `trend` dan RMK diabaikan.
 */
class MetarParser
{
    private const TREND_KEYWORDS = ['TEMPO', 'BECMG', 'NOSIG'];

    private const WEATHER = '/^(\+|-|VC)?(MI|BC|PR|DR|BL|SH|TS|FZ)?((DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS)+)$/';

    /**
     * @param  CarbonImmutable  $reference  Waktu sekarang untuk melengkapi bulan & tahun
     *                                     dari grup waktu DDHHMMZ.
     * @return array<string, mixed>
     *
     * @throws MetarFetchException bila teks bukan METAR yang dapat dibaca.
     */
    public static function parse(string $raw, CarbonImmutable $reference): array
    {
        $raw = trim(preg_replace('/\s+/', ' ', $raw));
        $tokens = explode(' ', rtrim($raw, '= '));

        $result = [
            'raw_text' => $raw,
            'icao' => null,
            'observed_at' => null,
            'wind_dir_deg' => null,
            'wind_variable' => false,
            'wind_var_from' => null,
            'wind_var_to' => null,
            'wind_speed_kt' => null,
            'wind_gust_kt' => null,
            'visibility_m' => null,
            'present_weather' => null,
            'clouds' => null,
            'temperature_c' => null,
            'dew_point_c' => null,
            'qnh_hpa' => null,
            'trend' => null,
        ];

        $i = 0;
        if (! in_array($tokens[$i] ?? '', ['METAR', 'SPECI'], true)) {
            throw new MetarFetchException(MetarFetchException::FORMAT, "Teks bukan laporan METAR: \"{$raw}\".");
        }
        $i++;
        if (($tokens[$i] ?? '') === 'COR') {
            $i++;
        }

        if (! preg_match('/^[A-Z]{4}$/', $tokens[$i] ?? '')) {
            throw new MetarFetchException(MetarFetchException::FORMAT, "Kode stasiun pada METAR tidak terbaca: \"{$raw}\".");
        }
        $result['icao'] = $tokens[$i++];

        if (! preg_match('/^(\d{2})(\d{2})(\d{2})Z$/', $tokens[$i] ?? '', $m)) {
            throw new MetarFetchException(MetarFetchException::FORMAT, "Waktu pengamatan pada METAR tidak terbaca: \"{$raw}\".");
        }
        $result['observed_at'] = self::resolveTime((int) $m[1], (int) $m[2], (int) $m[3], $reference);
        $i++;

        $weather = [];
        $clouds = [];

        for ($n = count($tokens); $i < $n; $i++) {
            $t = $tokens[$i];

            if ($t === 'RMK') {
                break;
            }
            if (in_array($t, self::TREND_KEYWORDS, true)) {
                $result['trend'] = implode(' ', array_slice($tokens, $i));
                break;
            }
            if (in_array($t, ['AUTO', 'NIL'], true)) {
                continue;
            }

            if (preg_match('/^(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?(KT|MPS)$/', $t, $m)) {
                $factor = $m[4] === 'MPS' ? 1.943844 : 1;
                $result['wind_variable'] = $m[1] === 'VRB';
                $result['wind_dir_deg'] = $m[1] === 'VRB' ? null : (int) $m[1];
                $result['wind_speed_kt'] = (int) round((int) $m[2] * $factor);
                $result['wind_gust_kt'] = ($m[3] ?? '') !== '' ? (int) round((int) $m[3] * $factor) : null;
                continue;
            }

            if (preg_match('/^(\d{3})V(\d{3})$/', $t, $m)) {
                $result['wind_var_from'] = (int) $m[1];
                $result['wind_var_to'] = (int) $m[2];
                continue;
            }

            if ($t === 'CAVOK') {
                $result['visibility_m'] = 10000;
                $clouds[] = 'CAVOK';
                continue;
            }

            // Visibilitas utama hanya diambil sekali; grup visibilitas minimum per
            // arah (mis. "1500SW") tidak cocok pola ini dan ikut diabaikan.
            if ($result['visibility_m'] === null && preg_match('/^(\d{4})(NDV)?$/', $t, $m)) {
                // 9999 berarti 10 km atau lebih.
                $result['visibility_m'] = $m[1] === '9999' ? 10000 : (int) $m[1];
                continue;
            }

            if (preg_match('/^(FEW|SCT|BKN|OVC)(\d{3}|\/\/\/)(CB|TCU|\/\/\/)?$/', $t)
                || preg_match('/^VV(\d{3}|\/\/\/)$/', $t)
                || in_array($t, ['NSC', 'NCD', 'SKC', 'CLR'], true)) {
                $clouds[] = $t;
                continue;
            }

            if (preg_match('/^(M?\d{2})\/(M?\d{2})?$/', $t, $m)) {
                $result['temperature_c'] = self::signedTemp($m[1]);
                $result['dew_point_c'] = ($m[2] ?? '') !== '' ? self::signedTemp($m[2]) : null;
                continue;
            }

            if (preg_match('/^Q(\d{4})$/', $t, $m)) {
                $result['qnh_hpa'] = (int) $m[1];
                continue;
            }

            if ($t === 'NSW' || preg_match(self::WEATHER, $t)) {
                $weather[] = $t;
            }
        }

        $result['present_weather'] = $weather ? implode(' ', $weather) : null;
        $result['clouds'] = $clouds ? implode(' ', $clouds) : null;

        return $result;
    }

    /**
     * METAR hanya memuat tanggal. Bulan & tahun diambil dari waktu sekarang (UTC),
     * mundur sebulan bila tanggalnya di depan (laporan akhir bulan lalu).
     */
    private static function resolveTime(int $day, int $hour, int $minute, CarbonImmutable $reference): CarbonImmutable
    {
        $ref = $reference->setTimezone('UTC');
        $month = $ref->startOfMonth();

        if ($day > $ref->day + 1) {
            $month = $month->subMonthNoOverflow();
        }

        return $month->setDate($month->year, $month->month, min($day, $month->daysInMonth))->setTime($hour, $minute);
    }

    private static function signedTemp(string $value): int
    {
        return str_starts_with($value, 'M') ? -(int) substr($value, 1) : (int) $value;
    }
}
