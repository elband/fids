import { useEffect, useRef, useState } from 'react';

/**
 * Hook jam realtime yang sinkron dengan server.
 * - Inisialisasi dari `utcIso` (waktu UTC server) supaya jam halaman tidak
 *   bergantung pada jam komputer client.
 * - Setiap tik menghitung ulang dari OFFSET tetap (server - client) memakai
 *   `Date.now()`, bukan menambah +1000ms per interval. Ini mencegah drift:
 *   `setInterval` tak pernah pas 1 detik dan di-throttle saat tab di background,
 *   sehingga pendekatan "+1000" akan makin tertinggal selama uptime panjang.
 * - Format selalu pakai `timeZone` (Intl) sehingga hasilnya selalu pas
 *   dengan zona waktu yang dipilih di Pengaturan Layar FIDS.
 */
export function useServerClock(utcIso?: string | null) {
    // Selisih (ms) antara jam server dan jam client saat sinkronisasi.
    const offsetRef = useRef<number>(0);
    const [now, setNow] = useState<Date>(() => (utcIso ? new Date(utcIso) : new Date()));

    useEffect(() => {
        // Hitung ulang offset saat UTC server berubah (mis. setelah Inertia reload).
        offsetRef.current = utcIso ? new Date(utcIso).getTime() - Date.now() : 0;
        setNow(new Date(Date.now() + offsetRef.current));

        const t = setInterval(() => {
            setNow(new Date(Date.now() + offsetRef.current));
        }, 1000);
        return () => clearInterval(t);
    }, [utcIso]);

    return now;
}

export function formatTimeInZone(date: Date, timezone: string, locale: string = 'id-ID') {
    return new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).format(date);
}

export function formatDateInZone(date: Date, timezone: string, locale: string = 'id-ID') {
    return new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

export function formatShortDateInZone(date: Date, timezone: string, locale: string = 'id-ID') {
    return new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(date);
}
