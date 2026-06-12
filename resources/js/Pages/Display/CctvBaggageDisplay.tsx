import { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import FidsLayout from '@/Layouts/FidsLayout';
import { Camera, Maximize2, AlertTriangle, Plane, Megaphone } from 'lucide-react';
import AdSlide, { AdItem } from '@/Components/AdSlide';
import { useNtpClock } from '@/hooks/useNtpClock';

type ActiveFlight = {
    id: number;
    nomor_penerbangan: string;
    jam_jadwal: string | null;
    jam_estimasi: string | null;
    jam_aktual: string | null;
    status: string;
    airline: { kode_maskapai: string | null; nama_maskapai: string | null; logo: string | null; warna_identitas: string | null } | null;
    airport_asal: { kode_iata: string | null; kota: string | null; nama_bandara: string | null } | null;
};

type CctvCamera = {
    id: number;
    nama: string;
    lokasi: string | null;
    jenis_stream: 'iframe' | 'mjpeg' | 'youtube';
    url_stream: string;
    baggage_claim_id: number | null;
    baggage_claim: { id: number; nomor_belt: string | number; terminal: string | null; area: string | null } | null;
    is_active: boolean;
    active_flight: ActiveFlight | null;
};

type Props = {
    cameras: CctvCamera[];
    advertisements: AdItem[];
    settings: {
        nama_bandara: string | null;
        background_header: string | null;
        teks_ticker: string | null;
        bahasa: 'id' | 'en';
        timezone: string;
    };
    server_timezone: string;
    utc_now: string;
};

function youtubeEmbed(url: string): string {
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtu.be')) {
            const id = u.pathname.replace('/', '');
            return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&playsinline=1`;
        }
        if (u.hostname.includes('youtube.com')) {
            if (u.pathname.startsWith('/embed/')) return url;
            const id = u.searchParams.get('v');
            if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&playsinline=1`;
            if (u.pathname.startsWith('/live/')) {
                const id2 = u.pathname.split('/')[2];
                return `https://www.youtube.com/embed/${id2}?autoplay=1&mute=1&controls=0&playsinline=1`;
            }
        }
    } catch { /* fallthrough */ }
    return url;
}

function CameraStreamInline({ cam }: { cam: CctvCamera }) {
    const [errored, setErrored] = useState(false);
    const isRtsp = /^rtsp:\/\//i.test(cam.url_stream);

    if (isRtsp) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full text-amber-300 px-6 text-center">
                <AlertTriangle size={42} />
                <p className="mt-2 text-sm tracking-wider uppercase font-semibold">RTSP tidak didukung browser</p>
                <p className="mt-1 text-[11px] text-amber-200/80 max-w-xs">
                    Konversi dulu via go2rtc / MediaMTX ke HLS / WebRTC, lalu pakai URL hasil konversi.
                </p>
            </div>
        );
    }
    if (errored) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full text-amber-300">
                <AlertTriangle size={42} />
                <p className="mt-2 text-sm tracking-wider uppercase">Stream tidak tersedia</p>
            </div>
        );
    }
    if (cam.jenis_stream === 'mjpeg') {
        return <img src={cam.url_stream} alt={cam.nama} onError={() => setErrored(true)} className="w-full h-full object-cover" />;
    }
    if (cam.jenis_stream === 'youtube') {
        return <iframe src={youtubeEmbed(cam.url_stream)} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
    }
    return <iframe src={cam.url_stream} className="w-full h-full bg-black" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
}

function CameraTile({ cam, ads }: { cam: CctvCamera; ads: AdItem[] }) {
    const showCctv = cam.is_active && !!cam.active_flight;
    const flight = cam.active_flight;
    const hasAds = ads && ads.length > 0;

    const handleFullscreen = () => {
        const el = document.getElementById(`cam-${cam.id}`);
        if (el && el.requestFullscreen) el.requestFullscreen();
    };

    return (
        <div
            id={`cam-${cam.id}`}
            className="relative bg-black rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-[0_0_20px_rgba(236,72,153,0.15)] group"
        >
            {/* status indicator */}
            <div className="absolute z-20 top-3 left-3 flex items-center gap-2">
                {showCctv ? (
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-600/85 backdrop-blur text-white text-xs font-semibold tracking-wider">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        LIVE
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/90 backdrop-blur text-black text-xs font-semibold tracking-wider">
                        <Megaphone size={12} />
                        STANDBY
                    </div>
                )}
                {cam.baggage_claim?.nomor_belt != null && (
                    <span className="px-2 py-1 rounded-full bg-fuchsia-600/80 backdrop-blur text-white text-[11px] font-bold tracking-wider">
                        BELT {cam.baggage_claim.nomor_belt}
                    </span>
                )}
            </div>

            {/* fullscreen button */}
            <button
                onClick={handleFullscreen}
                className="absolute z-20 top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition"
                title="Layar penuh"
            >
                <Maximize2 size={14} />
            </button>

            {/* video / ad area (16:9) */}
            <div className="relative w-full aspect-video bg-black">
                {showCctv ? (
                    <CameraStreamInline cam={cam} />
                ) : hasAds ? (
                    <AdSlide ads={ads} fitClass="object-cover" showProgress={false} />
                ) : (
                    <StandbyTile belt={cam.baggage_claim?.nomor_belt} />
                )}
            </div>

            {/* footer info */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-900/90 via-fuchsia-900/40 to-slate-900/90 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <Camera size={16} className="text-pink-300 shrink-0" />
                        <p className="text-white font-semibold text-sm tracking-wide uppercase truncate">{cam.nama}</p>
                    </div>
                    {showCctv && flight && (
                        <div className="flex items-center gap-2 shrink-0">
                            {flight.airline?.logo && (
                                <img src={flight.airline.logo} alt="" className="h-6 w-6 object-contain bg-white/10 rounded p-0.5" />
                            )}
                            <span className="font-bold text-white text-sm tabular-nums">{flight.nomor_penerbangan}</span>
                            <span className="text-[10px] uppercase tracking-wider text-pink-100/70">{flight.airport_asal?.kota ?? flight.airport_asal?.kode_iata ?? ''}</span>
                        </div>
                    )}
                </div>
                {!showCctv && (
                    <p className="text-pink-100/70 text-xs mt-1">
                        Menampilkan iklan â€” menunggu pesawat tiba
                    </p>
                )}
            </div>
        </div>
    );
}

function StandbyTile({ belt }: { belt?: string | number | null }) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg,#0b0617 0%,#160a26 50%,#0b0617 100%)' }}>
            <Plane size={56} className="text-pink-300/80" style={{ animation: 'wait-pulse 2.4s ease-in-out infinite' }} />
            <p className="mt-4 text-base font-bold tracking-[0.32em] uppercase text-pink-100">Belt {belt ?? '-'}</p>
            <p className="mt-1 text-[11px] text-pink-100/60 tracking-wider uppercase">Standby</p>
        </div>
    );
}

export default function CctvBaggageDisplay({ cameras, advertisements, settings, server_timezone, utc_now }: Props) {
    const { time24h, dateFullId } = useNtpClock();

    useEffect(() => {
        const refresh = setInterval(() => {
            router.reload({ only: ['cameras'] });
        }, 20000);
        return () => { clearInterval(refresh); };
    }, []);

    const time = time24h;
    const dateStr = dateFullId;

    const colsClass = cameras.length <= 1 ? 'grid-cols-1'
        : cameras.length === 2 ? 'grid-cols-1 md:grid-cols-2'
        : cameras.length <= 4 ? 'grid-cols-1 md:grid-cols-2'
        : cameras.length <= 6 ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
        : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';

    return (
        <FidsLayout title="FIDS - CCTV Pengambilan Bagasi">
            <Head title="CCTV Pengambilan Bagasi" />
            <style>{`
                @keyframes wait-pulse { 0%,100% { opacity: .5; transform: scale(.96); } 50% { opacity: 1; transform: scale(1.04); } }
            `}</style>
            <div className="h-screen text-white font-sans select-none overflow-hidden flex flex-col"
                style={{ background: 'linear-gradient(135deg,#0b0617 0%,#160a26 50%,#0b0617 100%)' }}
            >
                <header
                    className="relative w-full h-24 flex items-center justify-between px-8 overflow-hidden shadow-lg border-b border-pink-300/20 bg-cover bg-center"
                    style={{
                        backgroundImage: settings.background_header
                            ? `url(${settings.background_header})`
                            : 'linear-gradient(90deg, rgba(236,72,153,0.25), rgba(168,85,247,0.25), rgba(15,23,42,0.55))',
                    }}
                >
                    <div className="absolute inset-0 bg-black/45"></div>
                    <div className="relative z-10">
                        <p className="text-xs uppercase tracking-[0.36em] text-pink-100/80">CCTV Live</p>
                        <h1 className="mt-1 text-3xl font-extrabold tracking-tight drop-shadow">
                            Pengambilan Bagasi
                        </h1>
                    </div>
                    <div className="relative z-10 text-right">
                        <p className="text-xs uppercase tracking-[0.32em] text-pink-100/80">{settings.nama_bandara ?? 'FIDS'}</p>
                        <p className="text-2xl font-bold tabular-nums tracking-tight drop-shadow">{time}</p>
                        <p className="text-xs text-pink-100/80">{dateStr}</p>
                    </div>
                </header>

                <main className="flex-1 overflow-hidden p-6">
                    {cameras.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <Camera size={60} className="text-pink-300/70" />
                            <p className="mt-4 text-2xl font-semibold tracking-widest uppercase text-pink-100/80">Belum ada kamera</p>
                            <p className="mt-2 text-sm text-pink-100/60 max-w-md">
                                Tambahkan kamera CCTV grup <span className="font-semibold">baggage</span> melalui menu admin: <span className="font-mono">CCTV Cameras</span>.
                            </p>
                        </div>
                    ) : (
                        <div className={`grid gap-5 h-full ${colsClass}`}>
                            {cameras.map((cam) => (
                                <CameraTile key={cam.id} cam={cam} ads={advertisements} />
                            ))}
                        </div>
                    )}
                </main>

                {settings.teks_ticker && (
                    <footer className="h-10 bg-black/50 border-t border-pink-300/20 flex items-center overflow-hidden">
                        <div className="bg-pink-500 text-black font-bold px-4 h-full flex items-center shrink-0 z-10 text-xs tracking-widest uppercase">
                            INFO
                        </div>
                        <div className="w-full relative h-full flex items-center">
                            <div className="whitespace-nowrap absolute font-semibold text-pink-100 tracking-widest text-sm animate-[ticker_30s_linear_infinite]">
                                {settings.teks_ticker}
                            </div>
                        </div>
                    </footer>
                )}
            </div>
        </FidsLayout>
    );
}
