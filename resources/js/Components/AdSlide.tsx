import { useEffect, useMemo, useRef, useState } from 'react';

export interface AdItem {
    id: number;
    title?: string;
    media_path: string | null;
    media_type: 'image' | 'video';
    duration: number;
}

interface Props {
    ads: AdItem[];
    fitClass?: string; // e.g. 'object-cover' or 'object-contain'
    onIndexChange?: (idx: number) => void;
    transition?: 'auto' | 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'zoom' | 'kenburns';
    transitionMs?: number;
    showProgress?: boolean;
    overlay?: React.ReactNode; // optional overlay at top
}

const TRANSITIONS = ['fade', 'slide-left', 'slide-right', 'slide-up', 'zoom', 'kenburns'] as const;

export default function AdSlide({
    ads,
    fitClass = 'object-cover',
    onIndexChange,
    transition = 'auto',
    transitionMs = 900,
    showProgress = true,
    overlay,
}: Props) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<'in' | 'out'>('in');
    const [renderIndex, setRenderIndex] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    // Timer transisi + salinan terkini ads/index untuk menghindari:
    //  - setState pada komponen yang sudah unmount (Inertia page swap saat transisi),
    //  - perhitungan `next` dari closure `ads`/`index` yang basi.
    const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const adsRef = useRef(ads);
    const indexRef = useRef(0);
    useEffect(() => { adsRef.current = ads; }, [ads]);
    useEffect(() => { indexRef.current = index; }, [index]);
    useEffect(() => () => {
        if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    }, []);

    // Saat daftar iklan menyusut (admin menghapus iklan) sementara index menunjuk
    // slide yang sudah tidak ada, scheduler berhenti & layar blank permanen.
    // Kembalikan index ke rentang valid agar rotasi pulih sendiri.
    useEffect(() => {
        if (ads.length === 0) return;
        if (index >= ads.length || renderIndex >= ads.length) {
            const clamped = index % ads.length;
            indexRef.current = clamped;
            setIndex(clamped);
            setRenderIndex(clamped);
            setPhase('in');
        }
    }, [ads.length, index, renderIndex]);

    // Pick a transition for the current ad (random if 'auto')
    const activeTransition = useMemo(() => {
        if (transition !== 'auto') return transition;
        const seed = ads[renderIndex]?.id ?? renderIndex;
        return TRANSITIONS[seed % TRANSITIONS.length];
    }, [transition, renderIndex, ads]);

    const advance = () => {
        const list = adsRef.current;
        if (list.length === 0) return;
        // play exit
        setPhase('out');
        // after transition, swap index and trigger entrance.
        // Timer disimpan di ref agar bisa dibersihkan saat unmount / dijadwal ulang.
        if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = setTimeout(() => {
            const next = (indexRef.current + 1) % list.length;
            setIndex(next);
            setRenderIndex(next);
            setPhase('in');
            onIndexChange?.(next);
        }, transitionMs);
    };

    // Schedule next ad based on duration
    useEffect(() => {
        if (ads.length === 0) return;
        const ad = ads[index];
        if (!ad) return;

        // For video, advancement comes from onEnded event (with safety)
        if (ad.media_type === 'video') {
            const safety = setTimeout(advance, (ad.duration + 5) * 1000);
            return () => clearTimeout(safety);
        }
        const timer = setTimeout(advance, Math.max(2, ad.duration) * 1000);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index, ads]);

    if (ads.length === 0) {
        return null;
    }

    const ad = ads[renderIndex];
    if (!ad) return null;

    // Compute style for in/out phases
    const animClass = `ad-slide-${activeTransition}-${phase}`;
    const durStyle = { transitionDuration: `${transitionMs}ms`, animationDuration: `${transitionMs}ms` } as React.CSSProperties;
    const progressDuration = ad.media_type === 'image' ? Math.max(2, ad.duration) : Math.max(2, ad.duration);

    return (
        <div className="relative w-full h-full overflow-hidden">
            <style>{`
                /* Base slide layer */
                .ad-layer { position: absolute; inset: 0; will-change: transform, opacity, filter; }

                /* Fade */
                .ad-slide-fade-in       { opacity: 1; transform: scale(1.04); transition: opacity var(--ms,900ms) ease, transform 6s ease; animation: ad-fade-in var(--ms,900ms) ease both; }
                .ad-slide-fade-out      { opacity: 0; transform: scale(1.06); transition: opacity var(--ms,900ms) ease, transform var(--ms,900ms) ease; }
                @keyframes ad-fade-in   { from { opacity: 0; transform: scale(1); } to { opacity: 1; transform: scale(1.04); } }

                /* Slide left */
                .ad-slide-slide-left-in   { animation: ad-slide-left-in var(--ms,900ms) cubic-bezier(.2,.8,.2,1) both; }
                .ad-slide-slide-left-out  { animation: ad-slide-left-out var(--ms,900ms) cubic-bezier(.6,.05,.7,.2) both; }
                @keyframes ad-slide-left-in  { from { transform: translateX(100%); opacity: .2; } to { transform: translateX(0); opacity: 1; } }
                @keyframes ad-slide-left-out { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-100%); opacity: .2; } }

                /* Slide right */
                .ad-slide-slide-right-in  { animation: ad-slide-right-in var(--ms,900ms) cubic-bezier(.2,.8,.2,1) both; }
                .ad-slide-slide-right-out { animation: ad-slide-right-out var(--ms,900ms) cubic-bezier(.6,.05,.7,.2) both; }
                @keyframes ad-slide-right-in  { from { transform: translateX(-100%); opacity: .2; } to { transform: translateX(0); opacity: 1; } }
                @keyframes ad-slide-right-out { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: .2; } }

                /* Slide up */
                .ad-slide-slide-up-in   { animation: ad-slide-up-in var(--ms,900ms) cubic-bezier(.2,.8,.2,1) both; }
                .ad-slide-slide-up-out  { animation: ad-slide-up-out var(--ms,900ms) cubic-bezier(.6,.05,.7,.2) both; }
                @keyframes ad-slide-up-in  { from { transform: translateY(100%); opacity: .2; } to { transform: translateY(0); opacity: 1; } }
                @keyframes ad-slide-up-out { from { transform: translateY(0); opacity: 1; } to { transform: translateY(-100%); opacity: .2; } }

                /* Zoom */
                .ad-slide-zoom-in    { animation: ad-zoom-in var(--ms,900ms) cubic-bezier(.16,.84,.44,1) both; }
                .ad-slide-zoom-out   { animation: ad-zoom-out var(--ms,900ms) cubic-bezier(.7,0,.84,0) both; }
                @keyframes ad-zoom-in  { from { transform: scale(.7); opacity: 0; filter: blur(8px); } to { transform: scale(1); opacity: 1; filter: blur(0); } }
                @keyframes ad-zoom-out { from { transform: scale(1); opacity: 1; filter: blur(0); } to { transform: scale(1.4); opacity: 0; filter: blur(8px); } }

                /* Ken Burns: subtle pan & zoom while visible */
                .ad-slide-kenburns-in  { animation: ad-fade-in var(--ms,900ms) ease both, ad-kenburns 8s ease-in-out forwards; }
                .ad-slide-kenburns-out { animation: ad-fade-out var(--ms,900ms) ease both; }
                @keyframes ad-fade-out { from { opacity: 1; } to { opacity: 0; } }
                @keyframes ad-kenburns { from { transform: scale(1) translate(0,0); } to { transform: scale(1.1) translate(-2%, -2%); } }

                /* Progress bar */
                @keyframes ad-progress { from { width: 0%; } to { width: 100%; } }
            `}</style>

            <div
                key={`${ad.id}-${renderIndex}-${phase}`}
                className={`ad-layer ${animClass}`}
                style={{ ...durStyle, ['--ms' as any]: `${transitionMs}ms` }}
            >
                {ad.media_type === 'image' ? (
                    <img
                        src={ad.media_path?.startsWith('http') ? ad.media_path : `/storage/${ad.media_path}`}
                        alt={ad.title ?? `ad-${ad.id}`}
                        className={`w-full h-full ${fitClass}`}
                        draggable={false}
                    />
                ) : (
                    <video
                        ref={videoRef}
                        src={ad.media_path?.startsWith('http') ? ad.media_path : `/storage/${ad.media_path}`}
                        autoPlay
                        muted
                        playsInline
                        onEnded={advance}
                        className={`w-full h-full ${fitClass}`}
                    />
                )}
            </div>

            {overlay}

            {/* Progress strip */}
            {showProgress && (
                <div className="absolute left-0 right-0 bottom-0 h-1 bg-black/30 z-20">
                    <div
                        key={`${ad.id}-${renderIndex}`}
                        className="h-full bg-gradient-to-r from-pink-500 via-fuchsia-400 to-orange-300"
                        style={{ animation: `ad-progress ${progressDuration}s linear forwards` }}
                    />
                </div>
            )}
        </div>
    );
}
