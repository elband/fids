import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

interface Props {
    children: ReactNode;
    /**
     * Detik yang dibutuhkan untuk menggulir sejauh satu tinggi panel. Dipakai
     * sebagai satuan kecepatan karena maknanya sama di panel besar maupun kecil
     * — makin besar nilainya, makin lambat gulirannya.
     */
    secondsPerScreen?: number;
    /** Jarak kosong antar putaran, dalam piksel. */
    gap?: number;
    className?: string;
}

const DEFAULT_SECONDS_PER_SCREEN = 12;
const DEFAULT_GAP = 28;

/**
 * Menggulirkan isi panel ke atas terus-menerus bila kontennya lebih tinggi
 * daripada area yang tersedia.
 *
 * Isi digandakan dua kali dan seluruh pembungkusnya digeser -50%, sehingga
 * salinan kedua tepat menggantikan posisi salinan pertama saat animasi
 * mengulang — putarannya mulus tanpa lompatan.
 *
 * Memakai transform CSS (dipercepat GPU), bukan penyetelan scrollTop tiap
 * frame, supaya tetap halus di perangkat display berdaya rendah.
 */
export default function TaxiAutoScroll({
    children,
    secondsPerScreen = DEFAULT_SECONDS_PER_SCREEN,
    gap = DEFAULT_GAP,
    className = '',
}: Props) {
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [{ distance, duration }, setMetrics] = useState({ distance: 0, duration: 0 });

    // Jarak tempuh satu putaran = tinggi satu salinan + jarak antar putaran.
    // Bernilai 0 bila konten masih muat, sehingga animasi tidak dipasang.
    const measure = useCallback(() => {
        const viewport = viewportRef.current;
        const content = contentRef.current;
        if (!viewport || !content) return;

        const viewportHeight = viewport.clientHeight;
        const contentHeight = content.offsetHeight;

        if (contentHeight <= viewportHeight || viewportHeight === 0) {
            setMetrics({ distance: 0, duration: 0 });
            return;
        }

        const travel = contentHeight + gap;
        // Kecepatan tetap dalam "tinggi panel per detik" supaya laju bacanya
        // terasa sama baik pada panel pendek maupun panel tinggi.
        setMetrics({
            distance: travel,
            duration: (travel / viewportHeight) * Math.max(1, secondsPerScreen),
        });
    }, [gap, secondsPerScreen]);

    useEffect(() => {
        measure();

        // Tinggi berubah saat data disegarkan, bahasa bertukar, atau layar diputar.
        const observer = new ResizeObserver(measure);
        if (viewportRef.current) observer.observe(viewportRef.current);
        if (contentRef.current) observer.observe(contentRef.current);
        return () => observer.disconnect();
    }, [measure, children]);

    const scrolling = distance > 0;

    const copy = (hidden: boolean) => (
        <div ref={hidden ? undefined : contentRef} aria-hidden={hidden}>
            {children}
            {scrolling && <div style={{ height: gap }} />}
        </div>
    );

    return (
        <div ref={viewportRef} className={`relative overflow-hidden ${className}`}>
            <div
                className={scrolling ? 'taxi-scroll-up' : undefined}
                style={scrolling ? { animationDuration: `${duration}s` } : undefined}
            >
                {copy(false)}
                {scrolling && copy(true)}
            </div>
        </div>
    );
}
