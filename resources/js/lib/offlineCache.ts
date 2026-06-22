/**
 * Offline resilience untuk layar publik FIDS (audit M-02).
 *
 * Membungkus window.fetch sehingga:
 *  - Setiap GET ke /api/* yang sukses → disimpan ke localStorage (body + timestamp).
 *  - Saat GET ke /api/* GAGAL (jaringan/server/non-2xx) → otomatis menyajikan
 *    data terakhir dari localStorage, sehingga layar TETAP menampilkan informasi
 *    penerbangan terakhir (tidak blank) — termasuk setelah browser/kiosk reload.
 *  - Mem-broadcast event 'fids:net' (online/offline) untuk indikator status.
 *
 * Catatan: ini menutup seluruh layar yang memakai fetch('/api/...') tanpa perlu
 * mengubah tiap komponen. Untuk ketahanan saat *web server* mati total
 * (app-shell tidak termuat), diperlukan Service Worker (rekomendasi Fase 2).
 */

const PREFIX = 'fids:cache:';
const LAST_OK_KEY = 'fids:lastOnlineAt';

type NetDetail = { online: boolean; lastOnlineAt: number | null };

function emit(online: boolean) {
    let lastOnlineAt: number | null = null;
    try {
        const v = localStorage.getItem(LAST_OK_KEY);
        lastOnlineAt = v ? parseInt(v, 10) : null;
    } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent<NetDetail>('fids:net', { detail: { online, lastOnlineAt } }));
}

function isCacheableApiGet(method: string, url: string): boolean {
    if (method.toUpperCase() !== 'GET') return false;
    // Hanya endpoint data API (read), abaikan aset/Inertia/mutasi.
    return /\/api\//.test(url) && !/\/played(\?|$)/.test(url);
}

function resolveUrl(input: RequestInfo | URL): string {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.toString();
    return (input as Request).url;
}

export function installOfflineCache(): void {
    if (typeof window === 'undefined' || (window as any).__fidsOfflineInstalled) return;
    (window as any).__fidsOfflineInstalled = true;

    const nativeFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const method = (init?.method || (input as Request)?.method || 'GET').toUpperCase();
        const url = resolveUrl(input);
        const cacheable = isCacheableApiGet(method, url);
        const key = PREFIX + url;

        try {
            const res = await nativeFetch(input, init);

            if (cacheable && res.ok) {
                // Simpan salinan untuk fallback luring.
                try {
                    const clone = res.clone();
                    const body = await clone.text();
                    localStorage.setItem(key, JSON.stringify({ at: Date.now(), body }));
                    localStorage.setItem(LAST_OK_KEY, String(Date.now()));
                } catch { /* kuota localStorage / parse — abaikan */ }
                emit(true);
                return res;
            }

            // Respons non-2xx pada endpoint cacheable → coba fallback cache.
            if (cacheable && !res.ok) {
                const cached = readCache(key);
                if (cached) { emit(false); return cached; }
            }
            return res;
        } catch (err) {
            // Kegagalan jaringan total → sajikan cache bila ada.
            if (cacheable) {
                const cached = readCache(key);
                if (cached) { emit(false); return cached; }
            }
            throw err;
        }
    };
}

function readCache(key: string): Response | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const { body } = JSON.parse(raw) as { at: number; body: string };
        return new Response(body, {
            status: 200,
            statusText: 'OK (cache)',
            headers: { 'Content-Type': 'application/json', 'X-FIDS-Cache': 'HIT' },
        });
    } catch {
        return null;
    }
}
