import { useEffect, useRef, useState } from 'react';
import { announce } from '@/lib/announcer';

/**
 * Pemutar pengumuman PAS di browser layar (client), bukan di speaker server.
 *
 * Sebelumnya logika ini hanya ada di PublicScreenRealtime, sehingga TV yang
 * menampilkan papan keberangkatan/kedatangan tidak pernah bersuara — itulah
 * alasan pemutar sisi server dinyalakan, dan pemutar server itu yang menumpuk
 * proses mpg123 sampai CPU server habis.
 *
 * Satu pengumuman diputar pada satu waktu (isPlayingRef). Setelah selesai,
 * layar melapor ke endpoint /played supaya broadcast_count naik dan pengumuman
 * berhenti setelah mencapai batas pemutaran.
 *
 * CATATAN KIOSK: browser memblokir audio otomatis tanpa interaksi pengguna.
 * Jalankan kios dengan --autoplay-policy=no-user-gesture-required, kalau tidak
 * pengumuman pertama tidak akan terdengar sampai layar disentuh/diklik.
 */

const PENDING_URL = '/api/pending-announcements';
const POLL_MS = 10000;

type Pending = { id: number; isi_pengumuman?: string | null };

export function useAnnouncementPlayer(enabled = true): void {
    const [pending, setPending] = useState<Pending[]>([]);
    const isPlayingRef = useRef(false);
    const playedIdsRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        if (!enabled) return;

        const fetchPending = async () => {
            try {
                const res = await fetch(PENDING_URL, { headers: { Accept: 'application/json' } });
                if (!res.ok) return;
                const data = await res.json();
                setPending(Array.isArray(data) ? data : []);
            } catch {
                // Jaringan putus — jangan bersuara dari data basi, cukup diam.
            }
        };

        fetchPending();
        const timer = setInterval(fetchPending, POLL_MS);
        return () => clearInterval(timer);
    }, [enabled]);

    useEffect(() => {
        if (!enabled || isPlayingRef.current) return;

        const ann = pending.find((a) => !playedIdsRef.current.has(a.id));
        if (!ann) return;

        isPlayingRef.current = true;
        playedIdsRef.current.add(ann.id);

        const text = String(ann.isi_pengumuman ?? '').replace(/---/g, '. ');

        announce(text, { lang: 'id-ID', rate: 0.92 })
            .catch((e) => console.error('PAS: gagal memutar', e))
            .then(() =>
                // Endpoint publik tanpa auth/CSRF supaya kios yang tidak login tetap bisa melapor.
                fetch(`/api/fids/announcements/${ann.id}/played`, {
                    method: 'POST',
                    headers: { Accept: 'application/json' },
                }),
            )
            .catch((e) => console.error('PAS: gagal melapor', e))
            .finally(() => {
                isPlayingRef.current = false;
                // Segarkan antrian: yang sudah mencapai batas keluar dengan sendirinya.
                fetch(PENDING_URL, { headers: { Accept: 'application/json' } })
                    .then((r) => r.json())
                    .then((fresh: Pending[]) => {
                        // Lepas id dari daftar "sudah diputar" bila server tidak lagi
                        // menganggapnya pending, supaya bisa diputar lagi pada siklus
                        // berikutnya setelah interval_pemutaran terlewati.
                        if (!fresh.some((a) => a.id === ann.id)) {
                            playedIdsRef.current.delete(ann.id);
                        }
                        setPending(fresh);
                    })
                    .catch(() => { /* abaikan */ });
            });
    }, [pending, enabled]);
}
