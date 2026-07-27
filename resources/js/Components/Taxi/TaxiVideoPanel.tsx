import { useCallback, useEffect, useRef, useState } from 'react';
import { Film } from 'lucide-react';
import { Lang, TaxiSettings, TaxiVideo } from './types';
import { PanelTitle } from './TaxiFlightPanel';
import { t } from './i18n';

interface Props {
    videos: TaxiVideo[];
    settings: TaxiSettings;
    lang: Lang;
    /** Dipanggil saat satu video selesai/dilewati, untuk statistik pemutaran. */
    onPlayed?: (videoId: number, seconds: number) => void;
    /**
     * 'cover'   — penuhi area, tepi video dipangkas (area mendekati 16:9).
     * 'contain' — tampilkan utuh dengan bilah hitam (area pita lebar).
     */
    fit?: 'cover' | 'contain';
}

/**
 * Pemutar playlist digital signage.
 *
 * - Autoplay, tanpa kontrol, loop playlist, lanjut otomatis saat video habis.
 * - Video yang gagal dimuat langsung dilewati (NFR: jangan sampai layar diam).
 * - Hanya video yang sedang tayang yang di-mount, sehingga perangkat display
 *   tidak menahan seluruh playlist di memori.
 */
export default function TaxiVideoPanel({ videos, settings, lang, onPlayed, fit = 'cover' }: Props) {
    const [idx, setIdx] = useState(0);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const startedAt = useRef<number>(Date.now());
    // Dihitung agar playlist yang semua videonya rusak tidak berputar tanpa henti.
    const consecutiveErrors = useRef(0);

    const current = videos[idx] ?? videos[0];

    const advance = useCallback((played: boolean) => {
        if (current && played && onPlayed) {
            onPlayed(current.id, Math.round((Date.now() - startedAt.current) / 1000));
        }
        startedAt.current = Date.now();
        setIdx((i) => (videos.length ? (i + 1) % videos.length : 0));
    }, [current, onPlayed, videos.length]);

    // Jaga indeks tetap valid saat playlist berubah (mis. pergantian jam operasional).
    useEffect(() => {
        if (idx >= videos.length) setIdx(0);
    }, [videos.length, idx]);

    // Batas durasi opsional: 0 berarti tunggu sampai video benar-benar selesai.
    useEffect(() => {
        if (!current || settings.video_interval_detik <= 0) return;
        const timer = setTimeout(() => advance(true), settings.video_interval_detik * 1000);
        return () => clearTimeout(timer);
    }, [current?.id, settings.video_interval_detik, advance]);

    // Autoplay setiap kali video berganti; browser kios kadang menolak play() awal.
    useEffect(() => {
        const el = videoRef.current;
        if (!el) return;
        startedAt.current = Date.now();
        el.play().catch(() => { /* autoplay diblokir — onError/timer yang menangani */ });
    }, [current?.id]);

    const handleError = () => {
        consecutiveErrors.current += 1;
        if (consecutiveErrors.current > videos.length) {
            return; // seluruh playlist bermasalah; berhenti daripada memutar loop kosong
        }
        advance(false);
    };

    return (
        <section className="flex flex-col min-h-0 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <PanelTitle color={settings.warna_aksen}>{t('videoPanel', lang)}</PanelTitle>

            <div className="relative flex-1 min-h-0 mx-[1vw] mb-[1vmin] rounded-xl overflow-hidden bg-black ring-1 ring-white/10">
                {current?.url ? (
                    <video
                        key={current.id}
                        ref={videoRef}
                        src={current.url}
                        poster={current.thumbnail_url ?? undefined}
                        className={`absolute inset-0 h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
                        autoPlay
                        muted
                        playsInline
                        preload="auto"
                        controls={false}
                        disablePictureInPicture
                        onEnded={() => { consecutiveErrors.current = 0; advance(true); }}
                        onError={handleError}
                    />
                ) : (
                    <div className="absolute inset-0 grid place-items-center text-white/20">
                        <div className="text-center">
                            <Film className="mx-auto h-[6vmin] w-[6vmin]" />
                            <p className="mt-[1vmin] font-bold uppercase tracking-[0.25em]"
                               style={{ fontSize: 'clamp(0.6rem, 1.4vmin, 1.1rem)' }}>
                                {t('noVideos', lang)}
                            </p>
                        </div>
                    </div>
                )}

                {current && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-[0.9vw] pt-[3vmin] pb-[0.8vmin]">
                        <p className="text-white font-bold truncate" style={{ fontSize: 'clamp(0.65rem, 1.7vmin, 1.4rem)' }}>
                            {current.judul}
                        </p>
                        {videos.length > 1 && (
                            <p className="text-white/50 font-bold tabular-nums tracking-[0.2em]"
                               style={{ fontSize: 'clamp(0.45rem, 1.05vmin, 0.85rem)' }}>
                                {idx + 1} / {videos.length}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
