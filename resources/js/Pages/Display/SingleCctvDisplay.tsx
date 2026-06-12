import { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import FidsLayout from '@/Layouts/FidsLayout';
import { Camera as CameraIcon, Clock, AlertTriangle, Maximize2, MapPin, Radio, Plane, Megaphone } from 'lucide-react';
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

type Camera = {
    id: number;
    nama: string;
    lokasi: string | null;
    jenis_stream: 'iframe' | 'mjpeg' | 'youtube';
    url_stream: string;
    grup: string;
    baggage_claim_id: number | null;
    baggage_claim: { id: number; nomor_belt: string | number; terminal: string | null; area: string | null } | null;
    is_active: boolean;
    active_flight: ActiveFlight | null;
};

type Settings = {
    nama_bandara: string | null;
    background_header: string | null;
    bahasa: 'id' | 'en';
    timezone: string;
};

type Props = {
    camera: Camera | null;
    advertisements: AdItem[];
    settings: Settings;
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

const GLASS = 'bg-black/45 backdrop-blur-xl ring-1 ring-pink-300/20 shadow-2xl';

function CameraStream({ camera }: { camera: Camera }) {
    const [errored, setErrored] = useState(false);
    const isRtsp = /^rtsp:\/\//i.test(camera.url_stream);

    if (isRtsp) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full text-amber-300 px-8 text-center">
                <AlertTriangle size={72} />
                <p className="mt-4 text-3xl tracking-widest uppercase font-bold">RTSP Tidak Didukung Browser</p>
                <p className="mt-3 text-lg text-amber-200/80 max-w-2xl">
                    Konversi dulu via go2rtc / MediaMTX ke HLS atau WebRTC.
                </p>
            </div>
        );
    }
    if (errored) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full text-amber-300">
                <AlertTriangle size={64} />
                <p className="mt-3 text-2xl tracking-widest uppercase font-semibold">Stream tidak tersedia</p>
            </div>
        );
    }
    if (camera.jenis_stream === 'mjpeg') {
        return <img src={camera.url_stream} alt={camera.nama} onError={() => setErrored(true)} className="w-full h-full object-cover bg-black" />;
    }
    if (camera.jenis_stream === 'youtube') {
        return <iframe src={youtubeEmbed(camera.url_stream)} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
    }
    return <iframe src={camera.url_stream} className="w-full h-full bg-black" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
}

export default function SingleCctvDisplay({ camera, advertisements, settings, server_timezone, utc_now }: Props) {
    const { time24h, dateFullId } = useNtpClock();
    const [uptime, setUptime] = useState(0);

    useEffect(() => {
        // refresh data lebih sering supaya status flight terupdate cepat
        const refresh = setInterval(() => router.reload({ only: ['camera'] }), 20000);
        const ticker = setInterval(() => {
            setUptime((u) => u + 1);
        }, 1000);
        return () => { clearInterval(refresh); clearInterval(ticker); };
    }, []);

    const time = time24h;
    const dateStr = dateFullId;

    const uptimeStr = useMemo(() => {
        const h = Math.floor(uptime / 3600).toString().padStart(2, '0');
        const m = Math.floor((uptime % 3600) / 60).toString().padStart(2, '0');
        const s = (uptime % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }, [uptime]);

    if (!camera) {
        return (
            <FidsLayout title="FIDS - CCTV">
                <Head title="CCTV tidak ditemukan" />
                <div className="h-screen bg-black flex items-center justify-center text-white text-4xl">
                    Camera not found
                </div>
            </FidsLayout>
        );
    }

    const handleFullscreen = () => {
        const el = document.getElementById('cctv-stage');
        if (el && el.requestFullscreen) el.requestFullscreen();
    };

    // Mode: cctv â†” ads
    const showCctv = camera.is_active && !!camera.active_flight;
    const hasAds = advertisements && advertisements.length > 0;
    const flight = camera.active_flight;

    return (
        <FidsLayout title={`FIDS - ${camera.nama}`}>
            <Head title={`CCTV â€” ${camera.nama}`} />

            <style>{`
                @keyframes scan { 0% { transform: translateY(-100%);} 100% { transform: translateY(100vh);} }
                @keyframes corner-glow { 0%,100% { opacity: .35; } 50% { opacity: .7; } }
                @keyframes wait-pulse { 0%,100% { opacity: .35; transform: scale(.98); } 50% { opacity: .9; transform: scale(1.02); } }
            `}</style>

            <div
                id="cctv-stage"
                className="relative h-screen w-screen overflow-hidden text-white font-sans select-none"
                style={{ background: '#050309' }}
            >
                {/* Hero â€” CCTV / Ads / Standby */}
                <div className="absolute inset-0">
                    {showCctv ? (
                        <CameraStream camera={camera} />
                    ) : hasAds ? (
                        <AdSlide ads={advertisements} fitClass="object-cover" />
                    ) : (
                        <StandbyView belt={camera.baggage_claim?.nomor_belt} />
                    )}
                </div>

                {/* dark vignette */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/85 via-black/50 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 via-black/55 to-transparent" />

                {/* corner brackets â€” only when in CCTV mode */}
                {showCctv && (
                    <>
                        <div className="pointer-events-none absolute inset-6 ring-1 ring-pink-300/10 rounded-2xl" aria-hidden />
                        {[
                            'top-4 left-4 border-t-2 border-l-2',
                            'top-4 right-4 border-t-2 border-r-2',
                            'bottom-4 left-4 border-b-2 border-l-2',
                            'bottom-4 right-4 border-b-2 border-r-2',
                        ].map((cls, i) => (
                            <span
                                key={i}
                                aria-hidden
                                className={`pointer-events-none absolute h-12 w-12 rounded-md border-pink-400/70 ${cls}`}
                                style={{ animation: `corner-glow 3s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
                            />
                        ))}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 h-24 opacity-40"
                            style={{
                                background: 'linear-gradient(180deg, transparent 0%, rgba(236,72,153,0.18) 50%, transparent 100%)',
                                animation: 'scan 6s linear infinite',
                            }}
                        />
                    </>
                )}

                {/* TOP BAR */}
                <div className="absolute top-6 inset-x-6 flex items-start justify-between gap-4 z-20">
                    {/* left â€” clock */}
                    <div className={`${GLASS} rounded-2xl px-5 py-3 flex items-center gap-4`}>
                        <div className="p-2 rounded-xl bg-white/5 text-pink-200">
                            <Clock size={26} strokeWidth={2} />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-4xl font-black tracking-tight tabular-nums">{time}</span>
                            <span className="mt-2 text-[0.6rem] font-bold text-pink-100/70 uppercase tracking-[0.24em]">{dateStr}</span>
                        </div>
                    </div>

                    {/* center â€” title (changes by mode) */}
                    <div className={`${GLASS} rounded-2xl px-6 py-3 flex flex-col items-center text-center min-w-[20rem]`}>
                        <div className="flex items-center gap-2 text-pink-200/80 text-[0.65rem] font-bold uppercase tracking-[0.32em]">
                            {showCctv ? (
                                <><CameraIcon size={12} /> CCTV LIVE • BELT {camera.baggage_claim?.nomor_belt ?? '-'}</>
                            ) : (
                                <><Megaphone size={12} /> INFORMASI • BELT {camera.baggage_claim?.nomor_belt ?? '-'}</>
                            )}
                        </div>
                        <div className="mt-1 text-3xl font-black tracking-tight text-white drop-shadow uppercase truncate max-w-[28rem]">
                            {showCctv ? camera.nama : 'Menunggu Penerbangan'}
                        </div>
                        {showCctv ? (
                            camera.lokasi && (
                                <div className="mt-0.5 text-xs text-pink-100/80 flex items-center gap-1.5">
                                    <MapPin size={11} /> {camera.lokasi}
                                </div>
                            )
                        ) : (
                            <div className="mt-0.5 text-xs text-pink-100/80">
                                Layar akan menampilkan CCTV saat pesawat tiba di belt
                            </div>
                        )}
                    </div>

                    {/* right â€” airport */}
                    <div className={`${GLASS} rounded-2xl px-5 py-3 flex items-center gap-4`}>
                        <div className="text-pink-300 drop-shadow-[0_0_10px_rgba(236,72,153,0.7)]">
                            <Radio size={26} />
                        </div>
                        <div className="flex flex-col leading-tight text-right">
                            <span className="text-[0.6rem] font-bold text-pink-100/70 uppercase tracking-[0.24em]">
                                {showCctv ? 'CCTV LIVE' : 'STANDBY'}
                            </span>
                            <span className="text-base font-bold text-white truncate max-w-[14rem]">{settings.nama_bandara ?? 'FIDS'}</span>
                        </div>
                    </div>
                </div>

                {/* BOTTOM BAR */}
                <div className="absolute bottom-6 inset-x-6 flex items-end justify-between gap-4 z-20">
                    {/* left â€” LIVE/STANDBY indicator + flight info */}
                    <div className={`${GLASS} rounded-2xl px-5 py-3 flex items-center gap-4`}>
                        {showCctv ? (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-semibold tracking-[0.24em]">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                </span>
                                LIVE
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/90 text-black text-xs font-semibold tracking-[0.24em]">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-black opacity-60" style={{ animation: 'wait-pulse 1.6s ease-in-out infinite' }}></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
                                </span>
                                STANDBY
                            </div>
                        )}
                        {showCctv && flight ? (
                            <div className="flex items-center gap-3">
                                {flight.airline?.logo && (
                                    <img src={flight.airline.logo} alt="" className="h-7 w-7 rounded bg-white/10 object-contain p-0.5" />
                                )}
                                <div className="flex flex-col leading-none">
                                    <span className="text-base font-bold tracking-tight">{flight.nomor_penerbangan}</span>
                                    <span className="text-[0.6rem] uppercase tracking-[0.18em] text-pink-100/80">
                                        {flight.airport_asal?.kota ?? flight.airport_asal?.kode_iata ?? ''} • {flight.status}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col leading-none">
                                <span className="text-[0.55rem] font-bold text-pink-100/70 uppercase tracking-[0.32em]">SESSION</span>
                                <span className="mt-1.5 text-base font-bold text-white tabular-nums">{uptimeStr}</span>
                            </div>
                        )}
                    </div>

                    {/* right â€” fullscreen */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleFullscreen}
                            className={`${GLASS} rounded-2xl px-4 py-3 hover:bg-black/60 transition flex items-center gap-2`}
                            title="Layar penuh"
                        >
                            <Maximize2 size={18} className="text-pink-200" />
                            <span className="text-sm font-semibold tracking-wider uppercase text-pink-100">Fullscreen</span>
                        </button>
                    </div>
                </div>
            </div>
        </FidsLayout>
    );
}

function StandbyView({ belt }: { belt?: string | number | null }) {
    return (
        <div
            className="w-full h-full flex flex-col items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg,#0b0617 0%,#160a26 50%,#0b0617 100%)' }}
        >
            <div className="relative">
                <Plane size={120} className="text-pink-300/80" style={{ animation: 'wait-pulse 2.4s ease-in-out infinite' }} />
                <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 80px rgba(236,72,153,0.45)' }} />
            </div>
            <p className="mt-8 text-3xl font-black tracking-[0.32em] uppercase text-pink-100">
                Belt {belt ?? '-'} â€” Standby
            </p>
            <p className="mt-3 text-sm text-pink-100/60 tracking-wider uppercase">
                Belum ada penerbangan tiba di belt ini
            </p>
        </div>
    );
}
