import { useEffect, useState } from 'react';

/**
 * Hook jam realtime yang sinkron dengan server.
 * - Inisialisasi dari `utcIso` (waktu UTC server) supaya jam halaman tidak
 *   bergantung pada jam komputer client.
 * - Format selalu pakai `timeZone` (Intl) sehingga hasilnya selalu pas
 *   dengan zona waktu yang dipilih di Pengaturan Layar FIDS.
 */
export function useServerClock(utcIso?: string | null) {
    const [now, setNow] = useState<Date>(() => (utcIso ? new Date(utcIso) : new Date()));

    useEffect(() => {
        // Reset bila UTC server berubah (mis. setelah Inertia reload)
        if (utcIso) {
            setNow(new Date(utcIso));
        }
        const t = setInterval(() => {
            setNow((prev) => new Date(prev.getTime() + 1000));
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
