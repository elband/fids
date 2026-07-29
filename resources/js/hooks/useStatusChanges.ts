import { useEffect, useRef, useState } from 'react';

/**
 * Menandai penerbangan yang statusnya BARU berubah sejak polling sebelumnya.
 *
 * Papan merotasi baris tiap 15 detik dan me-remount seluruh baris, jadi gerakan
 * rutin tidak bisa dipakai penumpang untuk membedakan "papan bergerak" dari
 * "status penerbangan saya berubah". Id yang dikembalikan hook ini dipakai untuk
 * memberi sorotan + animasi flip hanya pada baris yang benar-benar berubah,
 * lalu padam sendiri setelah `holdMs`.
 *
 * Polling pertama tidak menandai apa pun (tidak ada pembanding), sehingga papan
 * tidak menyala serentak saat kios baru dinyalakan atau selesai reload.
 */
export function useStatusChanges<T extends { id: number; status: string }>(
    items: T[],
    holdMs = 6000,
): Set<number> {
    const seenRef = useRef<Map<number, string>>(new Map());
    const [changed, setChanged] = useState<Set<number>>(() => new Set());

    useEffect(() => {
        if (items.length === 0) return;

        const seen = seenRef.current;
        const fresh = new Set<number>();

        for (const item of items) {
            const before = seen.get(item.id);
            if (before !== undefined && before !== item.status) fresh.add(item.id);
            seen.set(item.id, item.status);
        }

        // Buang penerbangan yang sudah lepas dari papan. Kios menyala 24/7, jadi
        // Map ini akan tumbuh tanpa batas kalau tidak dipangkas.
        const alive = new Set(items.map((i) => i.id));
        for (const id of Array.from(seen.keys())) {
            if (!alive.has(id)) seen.delete(id);
        }

        if (fresh.size === 0) return;

        setChanged(fresh);
        const timer = window.setTimeout(() => setChanged(new Set()), holdMs);
        return () => window.clearTimeout(timer);
    }, [items, holdMs]);

    return changed;
}
