/**
 * Modul sinkronisasi waktu menggunakan NTP Server dari backend.
 * 
 * Sumber waktu: /api/fids/time (waktu server terkoreksi NTP)
 * Timezone: Diambil dari pengaturan DisplaySetting
 * 
 * Frontend menghitung offset antara waktu NTP-corrected server dan browser,
 * lalu menyesuaikan semua tampilan jam menggunakan offset tersebut.
 */

let ntpOffsetMs = 0;
let lastSyncAt = 0;
let currentTimezone = 'Asia/Makassar';
let currentLocale = 'id-ID';
let ntpStatus: 'synced' | 'unavailable' | 'pending' = 'pending';

const SYNC_TTL_MS = 60 * 1000; // Re-sync setiap 60 detik

export interface NtpTimeData {
    utc_now: string;
    display_time: string;
    timezone: string;
    bahasa: string;
    ntp_offset_ms: number;
    ntp_status: string;
    ntp_server: string | null;
    last_sync_at: string | null;
}

/**
 * Sinkronisasi waktu dengan server NTP backend.
 * Mengambil waktu terkoreksi NTP dari /api/fids/time dan menghitung offset lokal.
 */
export async function syncNtpClock(): Promise<void> {
    const now = Date.now();
    if (now - lastSyncAt < SYNC_TTL_MS) return;

    try {
        const t1 = Date.now();
        const res = await fetch('/api/fids/time', { cache: 'no-store' });
        const t2 = Date.now();

        if (!res.ok) {
            // Fallback ke API eksternal jika server lokal gagal
            await syncFallbackClock();
            return;
        }

        const json = await res.json();
        const data: NtpTimeData = json.data;

        if (!data?.utc_now) {
            await syncFallbackClock();
            return;
        }

        // Hitung network round-trip delay
        const networkDelay = (t2 - t1) / 2;

        // Parse waktu UTC dari server (sudah terkoreksi NTP)
        const serverTime = new Date(data.utc_now).getTime();

        // Offset = waktu server - waktu browser (termasuk kompensasi network delay)
        ntpOffsetMs = serverTime - (t1 + networkDelay);

        // Update timezone dan bahasa dari pengaturan
        if (data.timezone) {
            currentTimezone = data.timezone;
        }
        if (data.bahasa) {
            currentLocale = data.bahasa === 'en' ? 'en-US' : 'id-ID';
        }

        ntpStatus = data.ntp_status === 'synced' ? 'synced' : 'unavailable';
        lastSyncAt = Date.now();
    } catch {
        // Jika gagal, coba fallback
        await syncFallbackClock();
    }
}

/**
 * Fallback: sinkronisasi via API waktu internet jika server lokal tidak tersedia.
 */
async function syncFallbackClock(): Promise<void> {
    const urls = [
        'https://worldtimeapi.org/api/timezone/Etc/UTC',
        'https://timeapi.io/api/Time/current/zone?timeZone=UTC',
    ];

    for (const url of urls) {
        try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) continue;

            const json = await res.json();
            const possible = json?.utc_datetime || json?.datetime || json?.dateTime || json?.currentDateTime || json?.time;
            if (!possible) continue;

            const internetDate = new Date(possible);
            if (Number.isNaN(internetDate.getTime())) continue;

            ntpOffsetMs = internetDate.getTime() - Date.now();
            ntpStatus = 'unavailable'; // tandai tidak dari NTP
            lastSyncAt = Date.now();
            return;
        } catch {
            // try next
        }
    }

    // Jika semua gagal, tetap gunakan offset sebelumnya
    lastSyncAt = Date.now();
}

/**
 * Mendapatkan waktu sekarang yang sudah terkoreksi NTP.
 * Ini adalah sumber waktu utama yang harus digunakan di seluruh aplikasi.
 */
export function getNtpNow(): Date {
    return new Date(Date.now() + ntpOffsetMs);
}

/**
 * Mendapatkan timezone yang dikonfigurasi di pengaturan.
 */
export function getConfiguredTimezone(): string {
    return currentTimezone;
}

/**
 * Mendapatkan status sinkronisasi NTP.
 */
export function getNtpStatus(): 'synced' | 'unavailable' | 'pending' {
    return ntpStatus;
}

/**
 * Set timezone manual (misalnya dari props Inertia).
 */
export function setTimezone(tz: string): void {
    if (tz) currentTimezone = tz;
}

/**
 * Set locale dari setting bahasa ('id' → 'id-ID', 'en' → 'en-US').
 */
export function setLocale(bahasa: string): void {
    currentLocale = bahasa === 'en' ? 'en-US' : 'id-ID';
}

/**
 * Cache instance Intl.DateTimeFormat. Konstruksi formatter mahal; tanpa cache,
 * halaman jam (WorldClock tick 200ms) membangun ~20 formatter/detik terus-menerus
 * → tekanan CPU/GC di SoC TV lemah (audit MEDIUM). Kombinasi locale+tz+opsi sedikit,
 * jadi cache tetap kecil.
 */
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
    const key = locale + '|' + JSON.stringify(options);
    let fmt = formatterCache.get(key);
    if (!fmt) {
        fmt = new Intl.DateTimeFormat(locale, options);
        formatterCache.set(key, fmt);
    }
    return fmt;
}

/**
 * Format jam berdasarkan timezone yang dikonfigurasi.
 * Menggunakan waktu terkoreksi NTP.
 */
export function formatClockByTimezone(date: Date, timezone?: string) {
    const tz = timezone || currentTimezone;
    const locale = currentLocale;

    const dateText = getFormatter(locale, {
        timeZone: tz,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }).format(date);

    const timeText = getFormatter(locale, {
        timeZone: tz,
        hour: 'numeric',
        minute: '2-digit',
        hour12: locale === 'en-US',
    }).format(date);

    return { dateText, timeText };
}

/**
 * Format waktu 24-jam dengan detik.
 */
export function formatTime24h(date: Date, timezone?: string): string {
    const tz = timezone || currentTimezone;
    return getFormatter('en-GB', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).format(date);
}

/**
 * Format tanggal lengkap dalam Bahasa Indonesia.
 */
export function formatDateId(date: Date, timezone?: string): string {
    const tz = timezone || currentTimezone;
    return getFormatter('id-ID', {
        timeZone: tz,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

// ---- Legacy compatibility ----

/** @deprecated Gunakan syncNtpClock() */
export const syncInternetClock = syncNtpClock;

/** @deprecated Gunakan getNtpNow() */
export const getInternetNow = getNtpNow;

export function resolveTimezoneFromLocation(location?: string | null): string {
    // Tidak lagi diperlukan — timezone diambil dari pengaturan server
    // Tetap ada untuk backward compatibility
    return currentTimezone;
}
