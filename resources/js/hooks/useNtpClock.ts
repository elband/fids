import { useState, useEffect, useRef } from 'react';
import {
    syncNtpClock,
    getNtpNow,
    getConfiguredTimezone,
    formatClockByTimezone,
    formatTime24h,
    formatDateId,
} from '@/lib/timezoneClock';

interface NtpClockState {
    /** Waktu sekarang terkoreksi NTP */
    now: Date;
    /** Timezone dari pengaturan display */
    timezone: string;
    /** Jam format 12h (e.g., "2:30 PM") */
    timeText: string;
    /** Jam format 24h dengan detik (e.g., "14:30:45") */
    time24h: string;
    /** Tanggal format pendek (e.g., "Mon, May 19") */
    dateText: string;
    /** Tanggal format Indonesia lengkap (e.g., "Senin, 19 Mei 2026") */
    dateFullId: string;
}

/**
 * Hook untuk menampilkan jam yang tersinkronisasi NTP.
 * Gunakan ini di semua halaman display sebagai pengganti `new Date()`.
 * 
 * @param syncIntervalMs - Interval re-sync ke server (default: 60 detik)
 * @param tickMs - Interval update tampilan (default: 1000ms / 1 detik)
 */
export function useNtpClock(syncIntervalMs = 60_000, tickMs = 1000): NtpClockState {
    const [state, setState] = useState<NtpClockState>(() => {
        const now = getNtpNow();
        const tz = getConfiguredTimezone();
        const { dateText, timeText } = formatClockByTimezone(now, tz);
        return {
            now,
            timezone: tz,
            timeText,
            time24h: formatTime24h(now, tz),
            dateText,
            dateFullId: formatDateId(now, tz),
        };
    });

    const syncRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // Initial sync
        syncNtpClock();

        // Periodic sync
        syncRef.current = setInterval(() => {
            syncNtpClock();
        }, syncIntervalMs);

        // Clock tick — update tampilan setiap detik
        tickRef.current = setInterval(() => {
            const now = getNtpNow();
            const tz = getConfiguredTimezone();
            const { dateText, timeText } = formatClockByTimezone(now, tz);
            setState({
                now,
                timezone: tz,
                timeText,
                time24h: formatTime24h(now, tz),
                dateText,
                dateFullId: formatDateId(now, tz),
            });
        }, tickMs);

        return () => {
            if (syncRef.current) clearInterval(syncRef.current);
            if (tickRef.current) clearInterval(tickRef.current);
        };
    }, [syncIntervalMs, tickMs]);

    return state;
}
