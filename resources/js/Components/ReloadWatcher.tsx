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

export default function ReloadWatcher() {
    useEffect(() => {
        const path = window.location.pathname;
        const isPublic = /^\/(public|display|mclock)/.test(path);
        if (!isPublic) return;

        let cancelled = false;

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
                if (!res.ok || cancelled) return;
                const json = await res.json();
                const token = json?.data?.force_reload_at;
                if (token == null) return;

                const tokenStr = String(token);
                const last = localStorage.getItem(TOKEN_KEY);

                if (last === null) {
                    // Pertama kali melihat sinyal di perangkat ini — adopsi, jangan reload.
                    localStorage.setItem(TOKEN_KEY, tokenStr);
                    return;
                }

                if (tokenStr !== last) {
                    // Simpan dulu agar tidak reload berulang setelah memuat ulang.
                    localStorage.setItem(TOKEN_KEY, tokenStr);
                    await clearAppCaches();
                    window.location.reload();
                }
            } catch { /* offline / gagal — abaikan */ }
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
