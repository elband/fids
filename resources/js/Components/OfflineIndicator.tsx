import { useEffect, useRef, useState } from 'react';

/**
 * Indikator status koneksi untuk layar publik (audit M-02).
 * Muncul sebagai banner saat data API gagal diambil dan layar sedang
 * menampilkan data terakhir dari cache (mode luring). Mendengarkan event
 * 'fids:net' yang dipancarkan oleh offlineCache.
 *
 * Hanya tampil di halaman publik (path diawali /public, /mclock, /display).
 */
export default function OfflineIndicator() {
    const [offline, setOffline] = useState(false);
    const [lastOnlineAt, setLastOnlineAt] = useState<number | null>(null);
    const recoverTimer = useRef<number | null>(null);

    useEffect(() => {
        const path = window.location.pathname;
        const isPublic = /^\/(public|display|mclock)/.test(path);
        if (!isPublic) return;

        const onNet = (e: Event) => {
            const detail = (e as CustomEvent).detail as { online: boolean; lastOnlineAt: number | null };
            setLastOnlineAt(detail.lastOnlineAt ?? null);
            if (detail.online) {
                // Tunda penyembunyian sedikit agar tidak berkedip saat satu request gagal sporadis.
                if (recoverTimer.current) window.clearTimeout(recoverTimer.current);
                recoverTimer.current = window.setTimeout(() => setOffline(false), 1500);
            } else {
                if (recoverTimer.current) window.clearTimeout(recoverTimer.current);
                setOffline(true);
            }
        };

        window.addEventListener('fids:net', onNet);
        return () => {
            window.removeEventListener('fids:net', onNet);
            if (recoverTimer.current) window.clearTimeout(recoverTimer.current);
        };
    }, []);

    if (!offline) return null;

    const stamp = lastOnlineAt
        ? new Date(lastOnlineAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        : null;

    return (
        <div
            style={{ zIndex: 2147483647 }}
            className="fixed bottom-0 left-0 right-0 flex items-center justify-center gap-3 px-4 py-2 bg-amber-500 text-black font-bold tracking-wide shadow-[0_-4px_20px_rgba(0,0,0,0.4)] animate-pulse"
        >
            <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75 animate-ping" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-700" />
            </span>
            <span className="text-sm md:text-base uppercase">
                Mode Luring — Koneksi data terputus. Menampilkan data terakhir
                {stamp ? ` (per ${stamp})` : ''}.
            </span>
        </div>
    );
}
