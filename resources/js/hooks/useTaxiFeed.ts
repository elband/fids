import { useCallback, useEffect, useRef, useState } from 'react';
import { TaxiPayload } from '@/Components/Taxi/types';

/**
 * Polling payload layar taksi tanpa reload halaman.
 *
 * Failover: `installOfflineCache` (lib/offlineCache) sudah menyajikan salinan
 * terakhir saat API tak terjangkau dan menandainya dengan header X-FIDS-Cache.
 * Hook ini hanya perlu membaca tanda itu untuk mengganti indikator header
 * menjadi "Data sedang diperbarui" — konten lokal tetap tampil.
 */
export function useTaxiFeed(initial: TaxiPayload) {
    const [data, setData] = useState<TaxiPayload>(initial);
    const [online, setOnline] = useState(true);
    // Interval mengikuti pengaturan terbaru tanpa perlu memasang ulang timer.
    const intervalRef = useRef(initial.settings.flight_refresh_detik);
    intervalRef.current = data.settings.flight_refresh_detik;

    const fetchOnce = useCallback(async () => {
        try {
            const res = await fetch('/api/fids/taxi', { headers: { Accept: 'application/json' } });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (json?.data) setData(json.data as TaxiPayload);
            setOnline(res.headers.get('X-FIDS-Cache') !== 'HIT');
        } catch {
            setOnline(false); // pertahankan data terakhir di layar
        }
    }, []);

    useEffect(() => {
        let timer: number;
        const tick = () => {
            fetchOnce();
            timer = window.setTimeout(tick, Math.max(5, intervalRef.current) * 1000);
        };
        timer = window.setTimeout(tick, Math.max(5, intervalRef.current) * 1000);
        return () => window.clearTimeout(timer);
    }, [fetchOnce]);

    return { data, online };
}

/** Laporkan keberadaan layar agar muncul di dashboard monitoring. */
export function useScreenHeartbeat(screenCode: string) {
    useEffect(() => {
        if (!screenCode) return;

        const send = () => {
            fetch('/api/fids/taxi/heartbeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    kode: screenCode,
                    resolusi: `${window.screen.width}x${window.screen.height}`,
                }),
            }).catch(() => { /* offline — dicatat lagi pada denyut berikutnya */ });
        };

        send();
        // Setengah dari ambang offline (90 dtk) agar satu denyut hilang tak
        // langsung membuat layar terlihat mati.
        const timer = setInterval(send, 45000);
        return () => clearInterval(timer);
    }, [screenCode]);
}

/** Kirim statistik satu video yang selesai diputar. */
export function reportVideoPlayed(videoId: number, seconds: number) {
    fetch(`/api/fids/taxi/videos/${videoId}/played`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ seconds }),
    }).catch(() => { /* statistik bersifat best-effort */ });
}
