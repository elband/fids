import { useEffect } from 'react';

/**
 * Pemantau sinyal "segarkan semua layar TV" (dari Pengaturan Layar FIDS).
 *
 * Semua layar publik memanggil /api/fids/settings secara berkala. Komponen ini
 * ikut memantau field `force_reload_at`. Saat admin menekan tombol refresh di
 * panel, nilai itu berubah; setiap layar yang melihat perubahan akan me-reload
 * dirinya (sekaligus membersihkan cache offline app agar data segar).
 *
 * Anti-loop: token terakhir disimpan di localStorage SEBELUM reload, sehingga
 * setelah memuat ulang nilainya sudah sama dan tidak reload lagi. Layar yang
 * baru pertama kali melihat token langsung mengadopsinya tanpa reload.
 *
 * Hanya aktif di halaman publik (path diawali /public, /display, /mclock).
 */
const TOKEN_KEY = 'fids:reloadToken';
const POLL_MS = 12000;

/**
 * Jaring pengaman kiosk 24/7 (selain sinyal reload manual dari admin):
 *  - Auto-reload BERKALA: tiap `auto_reload_jam` (dari Pengaturan; 0 = mati).
 *  - Auto-reload saat DATA BASI: bila koneksi ke server gagal terus-menerus
 *    lebih dari STALE_RELOAD_MS, layar memuat ulang (pulih sendiri saat server
 *    kembali). Guard di sessionStorage mencegah reload beruntun.
 */
const STALE_RELOAD_MS = 5 * 60 * 1000; // 5 menit tanpa koneksi sukses → reload
const STALE_GUARD_KEY = 'fids:lastStaleReload';

export default function ReloadWatcher() {
    useEffect(() => {
        const path = window.location.pathname;
        const isPublic = /^\/(public|display|mclock)/.test(path);
        if (!isPublic) return;

        let cancelled = false;
        const pageLoadedAt = Date.now();
        let lastOkAt = Date.now(); // anggap sehat saat halaman baru dimuat

        // Optimistis: mulai dalam mode hemat (default) supaya Raspberry Pi tidak
        // sempat merender efek berat di frame awal; fetch akan mengoreksi bila off.
        document.documentElement.classList.add('perf-lite');

        const clearAppCaches = async () => {
            try {
                Object.keys(localStorage)
                    .filter((k) => k.startsWith('fids:cache:'))
                    .forEach((k) => localStorage.removeItem(k));
            } catch { /* ignore */ }
            try {
                if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((k) => caches.delete(k)));
                }
            } catch { /* ignore */ }
        };

        const check = async () => {
            try {
                const res = await fetch('/api/fids/settings', { cache: 'no-store' });
                if (cancelled) return;
                if (!res.ok) throw new Error(`http ${res.status}`);
                const json = await res.json();
                lastOkAt = Date.now(); // koneksi & server sehat

                // (0) Mode Hemat (Raspberry Pi): pasang/lepas kelas perf-lite di <html>.
                const hemat = json?.data?.mode_hemat !== false; // default aktif bila tak ada
                document.documentElement.classList.toggle('perf-lite', hemat);

                // (1) Sinyal reload manual dari admin (force_reload_at).
                const token = json?.data?.force_reload_at;
                if (token != null) {
                    const tokenStr = String(token);
                    const last = localStorage.getItem(TOKEN_KEY);
                    if (last === null) {
                        // Pertama kali melihat sinyal — adopsi, jangan reload.
                        localStorage.setItem(TOKEN_KEY, tokenStr);
                    } else if (tokenStr !== last) {
                        localStorage.setItem(TOKEN_KEY, tokenStr);
                        await clearAppCaches();
                        window.location.reload();
                        return;
                    }
                }

                // (2) Auto-reload berkala (jam dari Pengaturan; 0 = nonaktif).
                const jam = Number(json?.data?.auto_reload_jam) || 0;
                if (jam > 0 && Date.now() - pageLoadedAt >= jam * 3_600_000) {
                    await clearAppCaches();
                    window.location.reload();
                    return;
                }
            } catch {
                if (cancelled) return;
                // (3) Auto-reload saat data basi: koneksi/server gagal terlalu lama.
                if (Date.now() - lastOkAt >= STALE_RELOAD_MS) {
                    let last = 0;
                    try { last = Number(sessionStorage.getItem(STALE_GUARD_KEY) || '0'); } catch { /* ignore */ }
                    if (Date.now() - last >= STALE_RELOAD_MS) {
                        try { sessionStorage.setItem(STALE_GUARD_KEY, String(Date.now())); } catch { /* ignore */ }
                        window.location.reload();
                    }
                }
            }
        };

        check();
        const timer = window.setInterval(check, POLL_MS);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, []);

    return null;
}
