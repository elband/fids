import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * Teks satu baris yang mengisi penuh kotaknya: ukuran huruf dihitung dari lebar
 * dan tinggi wadah, bukan dipatok clamp() lalu dipotong.
 *
 * Dipakai untuk nama operator taksi. Dengan clamp() tetap, nama pendek ("Kilat")
 * tampak kekecilan di kartu selebar apa pun, sedangkan nama panjang
 * ("Angkasa Jaya") kena truncate — dua-duanya buruk dibaca dari jauh, yang justru
 * satu-satunya tugas layar ini.
 *
 * Cara kerja: ukur teks pada ukuran probe, lalu skalakan sesuai rasio ruang yang
 * tersedia. Dua lintasan sudah cukup akurat untuk teks satu baris — lintasan
 * kedua mengoreksi pembulatan metrik font pada lintasan pertama.
 */

const PROBE_PX = 100;
const SAFETY = 0.96; // sisakan sedikit napas supaya huruf tidak menyentuh tepi

export default function FitText({
    children,
    min = 10,
    max = 96,
    className,
    style,
}: {
    children: string;
    /** Batas bawah ukuran huruf (px) — di bawah ini teks tidak lagi terbaca dari jauh. */
    min?: number;
    /** Batas atas (px) supaya nama sangat pendek tidak jadi raksasa. */
    max?: number;
    className?: string;
    style?: React.CSSProperties;
}) {
    const boxRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [size, setSize] = useState(min);

    const fit = useCallback(() => {
        const box = boxRef.current;
        const text = textRef.current;
        if (!box || !text) return;

        const available = { w: box.clientWidth, h: box.clientHeight };
        if (available.w <= 0 || available.h <= 0) return;

        let next = min;

        for (let pass = 0; pass < 2; pass++) {
            text.style.fontSize = `${PROBE_PX}px`;
            const w = text.scrollWidth;
            const h = text.scrollHeight;
            if (w <= 0 || h <= 0) return;

            const ratio = Math.min(available.w / w, available.h / h);
            next = Math.max(min, Math.min(max, Math.floor(PROBE_PX * ratio * SAFETY)));
            text.style.fontSize = `${next}px`;
        }

        // Hanya perbarui state bila benar-benar berubah, supaya tidak ada
        // putaran render tak berujung antara measure dan paint.
        setSize((prev) => (Math.abs(prev - next) >= 1 ? next : prev));
        // Sengaja tidak bergantung pada `size`: hasil ukur tidak dipengaruhi
        // ukuran saat ini (probe selalu dari PROBE_PX), dan menyertakannya akan
        // membangun ulang ResizeObserver tiap kali huruf berubah ukuran.
    }, [min, max]);

    useLayoutEffect(() => {
        fit();

        const box = boxRef.current;
        if (!box || typeof ResizeObserver === 'undefined') return;

        // Kartu ikut berubah saat jumlah counter atau resolusi layar berubah.
        const observer = new ResizeObserver(() => fit());
        observer.observe(box);
        return () => observer.disconnect();
    }, [fit, children]);

    return (
        <div ref={boxRef} className="w-full h-full min-w-0 flex items-center overflow-hidden">
            <span
                ref={textRef}
                className={className}
                style={{ ...style, fontSize: `${size}px`, whiteSpace: 'nowrap', lineHeight: 1.05 }}
            >
                {children}
            </span>
        </div>
    );
}
