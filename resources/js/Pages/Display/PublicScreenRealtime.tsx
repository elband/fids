import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { Monitor, Volume2, PlaneTakeoff, PlaneLanding } from 'lucide-react';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import AdSlide from '@/Components/AdSlide';
import { announce } from '@/lib/announcer';
import { useNtpClock } from '@/hooks/useNtpClock';

type Flight = {
    id: number;
    nomor_penerbangan: string;
    jam_jadwal: string;
    status: string;
    airline?: { nama: string; logo: string };
    airport_asal?: { kota: string; kode: string };
    airport_tujuan?: { kota: string; kode: string };
};

type FlightRow = Flight & { _type: 'departure' | 'arrival' };

type Ad = {
    id: number;
    title: string;
    media_path: string | null;
    media_type: 'image' | 'video';
    duration: number;
};

type PublicScreenProps = {
    settings: {
        screen_title: string;
        layout_type: 'single' | '2-column' | '3-column';
        show_clock: boolean;
        show_weather: boolean;
        show_ticker: boolean;
        show_departures: boolean;
        show_arrivals: boolean;
        show_advertisement: boolean;
        theme_color: string;
        kecepatan_scroll: number;
        ticker_text: string;
        background_header_url: string | null;
        timezone?: string | null;
    };
    departures: Flight[];
    arrivals: Flight[];
    pendingAnnouncements: any[];
    advertisements: Ad[];
    weather: {
        suhu: number;
        kondisi_cuaca: string;
        kelembapan: number;
        kecepatan_angin: number;
    } | null;
    server_timezone?: string;
    utc_now?: string;
};

/* â”€â”€â”€ Unified Flight Card â”€â”€â”€ */
const UnifiedFlightCard = ({
    departures,
    arrivals,
    showDepartures,
    showArrivals,
    kecepatan_scroll,
}: {
    departures: Flight[];
    arrivals: Flight[];
    showDepartures: boolean;
    showArrivals: boolean;
    kecepatan_scroll: number;
}) => {
    const allFlights: FlightRow[] = [
        ...(showDepartures ? departures.map(f => ({ ...f, _type: 'departure' as const })) : []),
        ...(showArrivals   ? arrivals.map(f   => ({ ...f, _type: 'arrival'   as const })) : []),
    ].sort((a, b) => (a.jam_jadwal || '').localeCompare(b.jam_jadwal || ''));

    const scrollRef = useAutoScroll(kecepatan_scroll || 1, 4000, [departures.length, arrivals.length]);

    const statusStyle = (status: string) => {
        if (status === 'Boarding')     return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.2)]';
        if (status === 'Delayed')      return 'bg-red-500/15 text-red-400 border-red-500/30';
        if (status === 'Landed')       return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
        if (status === 'Cancelled')    return 'bg-red-800/30 text-red-300 border-red-700/40';
        if (status === 'Baggage Claim') return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
        return 'bg-white/5 text-white/50 border-white/10';
    };

    return (
        <section
            className="rounded-2xl bg-black/40 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden"
            style={{ height: '70vh' }}
        >
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] shrink-0"
                style={{ padding: '1.2vh 2vw' }}>
                <div className="flex items-center gap-4">
                    {showDepartures && (
                        <span className="flex items-center gap-1.5" style={{ fontSize: '1vw' }}>
                            <PlaneTakeoff className="text-emerald-400" style={{ width: '1.2vw', height: '1.2vw' }} />
                            <span className="font-black text-emerald-400">Keberangkatan</span>
                        </span>
                    )}
                    {showDepartures && showArrivals && (
                        <span className="text-white/15 font-bold">|</span>
                    )}
                    {showArrivals && (
                        <span className="flex items-center gap-1.5" style={{ fontSize: '1vw' }}>
                            <PlaneLanding className="text-sky-400" style={{ width: '1.2vw', height: '1.2vw' }} />
                            <span className="font-black text-sky-400">Kedatangan</span>
                        </span>
                    )}
                </div>
                <span style={{ fontSize: '0.65vw' }} className="font-bold text-white/25 uppercase tracking-[0.2em]">
                    Real-time Â· {allFlights.length} Penerbangan
                </span>
            </div>

            {/* Column headers */}
            <div className="bg-black/60 border-b border-white/[0.05] shrink-0 grid"
                style={{
                    gridTemplateColumns: '4vw 7vw 2fr 2fr 3fr 2.5fr',
                    padding: '0.6vh 1.5vw',
                    fontSize: '0.6vw',
                    letterSpacing: '0.18em',
                }}>
                <span className="font-black text-white/25 uppercase"></span>
                <span className="font-black text-white/25 uppercase">Maskapai</span>
                <span className="font-black text-white/25 uppercase">Flight</span>
                <span className="font-black text-white/25 uppercase">Jadwal</span>
                <span className="font-black text-white/25 uppercase">Tujuan / Asal</span>
                <span className="font-black text-white/25 uppercase text-right">Status</span>
            </div>

            {/* Rows */}
            <div ref={scrollRef} className="overflow-y-auto flex-grow hide-scrollbar">
                {allFlights.length > 0 ? allFlights.map((flight) => (
                    <div
                        key={`${flight._type}-${flight.id}`}
                        className="grid items-center border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors group"
                        style={{
                            gridTemplateColumns: '4vw 7vw 2fr 2fr 3fr 2.5fr',
                            padding: '1vh 1.5vw',
                            gap: '0.5vw',
                        }}
                    >
                        {/* Type badge */}
                        <div className="flex items-center justify-center">
                            {flight._type === 'departure' ? (
                                <PlaneTakeoff
                                    className="text-emerald-400"
                                    style={{ width: '3vw', height: '3vw' }}
                                />
                            ) : (
                                <PlaneLanding
                                    className="text-sky-400"
                                    style={{ width: '3vw', height: '3vw' }}
                                />
                            )}
                        </div>

                        {/* Logo */}
                        <div className="flex items-center">
                            {flight.airline?.logo ? (
                                <div
                                    className="bg-white rounded-xl flex items-center justify-center shadow-[0_0_12px_rgba(255,255,255,0.25)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all border border-white/30"
                                    style={{ width: '6vw', height: '6vh', padding: '0.5vh 0.6vw', flexShrink: 0 }}
                                >
                                    <img
                                        src={flight.airline.logo.startsWith('http') ? flight.airline.logo : `/storage/${flight.airline.logo}`}
                                        alt={flight.airline.nama}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                </div>
                            ) : (
                                <div
                                    className="rounded-xl bg-white/10 border border-white/20 flex items-center justify-center"
                                    style={{ width: '6vw', height: '6vh' }}
                                >
                                    <span style={{ fontSize: '0.55vw' }} className="text-white/40 font-black uppercase tracking-widest">
                                        {flight.airline?.nama?.substring(0, 3) || 'â€”'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Flight number */}
                        <div>
                            <span style={{ fontSize: '1.2vw' }} className="font-bold text-white/80 tracking-tight">
                                {flight.nomor_penerbangan}
                            </span>
                        </div>

                        {/* Schedule */}
                        <div>
                            <span style={{ fontSize: '2vw' }} className="font-black font-mono text-white tracking-tighter leading-none">
                                {flight.jam_jadwal?.substring(0, 5) || '--:--'}
                            </span>
                        </div>

                        {/* Destination / Origin */}
                        <div>
                            <span style={{ fontSize: '1.6vw' }} className="font-black text-amber-400 uppercase tracking-tight">
                                {flight._type === 'departure'
                                    ? (flight.airport_tujuan?.kota || 'â€”')
                                    : (flight.airport_asal?.kota   || 'â€”')}
                            </span>
                            <p style={{ fontSize: '0.6vw' }} className="text-white/25 uppercase font-bold tracking-wider mt-0.5">
                                {flight._type === 'departure'
                                    ? (flight.airport_tujuan?.kode || '')
                                    : (flight.airport_asal?.kode   || '')}
                            </p>
                        </div>

                        {/* Status */}
                        <div className="flex justify-end">
                            <span
                                style={{ fontSize: '0.75vw', padding: '0.35vh 0.8vw' }}
                                className={`inline-block rounded-lg font-black uppercase tracking-widest border ${statusStyle(flight.status)}`}
                            >
                                {flight.status}
                            </span>
                        </div>
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center gap-3 text-white/15 h-full" style={{ padding: '6vh 0' }}>
                        <Monitor size={48} strokeWidth={1} />
                        <p style={{ fontSize: '0.9vw' }} className="font-bold uppercase tracking-widest italic">
                            Belum ada jadwal penerbangan hari ini.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
};

/* â”€â”€â”€ AdPanel â”€â”€â”€ */
const AdPanel = ({ ads }: { ads: Ad[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (ads.length === 0) {
        return (
            <section className="rounded-2xl bg-black/30 border border-white/10 backdrop-blur-md flex items-center justify-center" style={{ height: '70vh' }}>
                <p style={{ fontSize: '1vw' }} className="text-white/25 font-bold uppercase tracking-widest">Belum ada iklan aktif</p>
            </section>
        );
    }

    return (
        <section className="rounded-2xl overflow-hidden border border-orange-500/20 shadow-2xl relative bg-black" style={{ height: '70vh' }}>
            <AdSlide
                ads={ads as any}
                fitClass="object-cover"
                transition="auto"
                transitionMs={900}
                showProgress={true}
                onIndexChange={setCurrentIndex}
                overlay={
                    <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-black/50 backdrop-blur-md border-b border-orange-500/20"
                        style={{ padding: '0.8vh 1.5vw' }}>
                        <span style={{ fontSize: '0.75vw' }} className="font-black uppercase tracking-widest text-orange-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)] animate-pulse inline-block"></span>
                            Advertisement
                        </span>
                        <span style={{ fontSize: '0.6vw' }} className="text-white/25 font-bold">{currentIndex + 1} / {ads.length}</span>
                    </div>
                }
            />
        </section>
    );
};

/* â”€â”€â”€ Main â”€â”€â”€ */
export default function PublicScreenRealtime({ settings, departures, arrivals, weather, advertisements, server_timezone, utc_now }: PublicScreenProps) {
    const { time24h, dateFullId } = useNtpClock();
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [pending, setPending] = useState<any[]>([]);
    const isPlayingRef = useRef(false);
    const playedIdsRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        const refreshTimer = setInterval(() => {
            router.reload({ only: ['settings', 'departures', 'arrivals', 'weather', 'advertisements'] });
        }, 10000);
        return () => { clearInterval(refreshTimer); };
    }, []);

    useEffect(() => {
        const fetchPending = async () => {
            if (!audioEnabled) return;
            try {
                const res = await fetch(route('api.pending-announcements'));
                const data = await res.json();
                setPending(data);
            } catch (e) {
                console.error('Audio: Failed to fetch announcements', e);
            }
        };
        const timer = setInterval(fetchPending, 10000);
        if (audioEnabled) fetchPending();
        return () => clearInterval(timer);
    }, [audioEnabled]);

    useEffect(() => {
        if (!audioEnabled || isPlayingRef.current) return;
        const ann = pending.find((a) => !playedIdsRef.current.has(a.id));
        if (!ann) return;

        isPlayingRef.current = true;
        playedIdsRef.current.add(ann.id);
        const text = String(ann.isi_pengumuman ?? '').replace(/---/g, '. ');

        announce(text, { lang: 'id-ID', rate: 0.92 })
            .catch((e) => console.error('Speak failed', e))
            .then(() => {
                // Laporkan ke server bahwa pengumuman selesai diputar -> broadcast_count naik.
                // Endpoint API publik (tanpa auth/CSRF) agar layar kiosk yang tidak login tetap bisa melapor.
                return fetch(`/api/fids/announcements/${ann.id}/played`, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' },
                });
            })
            .catch((e) => console.error('Increment failed', e))
            .finally(() => {
                isPlayingRef.current = false;
                // refresh pending agar yang sudah max keluar dari antrian
                fetch(route('api.pending-announcements'))
                    .then((r) => r.json())
                    .then((fresh) => {
                        // Lepas id dari daftar "sudah diputar" bila server sudah men-gating-nya
                        // (tidak lagi pending). Dengan begitu pengumuman bisa diputar lagi
                        // pada siklus berikutnya setelah interval_pemutaran terlewati.
                        if (!fresh.some((a: any) => a.id === ann.id)) {
                            playedIdsRef.current.delete(ann.id);
                        }
                        setPending(fresh);
                    })
                    .catch(() => { /* ignore */ });
            });
    }, [pending, audioEnabled]);

    const time    = time24h;
    const dateStr = dateFullId;

    const showFlights = settings.show_departures || settings.show_arrivals;
    const showAd      = settings.show_advertisement && advertisements.length > 0;

    // Grid: 1 col (flights only) or 2 cols (flights + ad)
    const gridCols = showFlights && showAd ? 'grid-cols-2' : 'grid-cols-1';

    return (
        <>
            <Head title="Layar Publik Realtime" />

            {/* Audio Overlay */}
            {!audioEnabled && (
                <div
                    onClick={() => setAudioEnabled(true)}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-3xl cursor-pointer group"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500 blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative rounded-full border-2 border-emerald-500/30 flex items-center justify-center bg-emerald-500/10 group-hover:scale-110 transition-transform duration-500"
                            style={{ width: '8vw', height: '8vw' }}>
                            <div className="rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.5)]"
                                style={{ width: '5vw', height: '5vw' }}>
                                <Volume2 style={{ width: '2.5vw', height: '2.5vw' }} className="text-white animate-pulse" />
                            </div>
                        </div>
                    </div>
                    <h2 style={{ fontSize: '3vw' }} className="mt-12 font-black text-white tracking-widest uppercase">Aktifkan Suara</h2>
                    <p style={{ fontSize: '1vw' }} className="mt-4 text-emerald-400 font-bold uppercase tracking-[0.4em] animate-bounce">
                        Klik di mana saja untuk memulai siaran
                    </p>
                    <div className="absolute bottom-12 text-white/20 font-bold uppercase tracking-widest flex items-center gap-2"
                        style={{ fontSize: '0.8vw' }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
                        Public Address System Mode Active
                    </div>
                </div>
            )}

            {audioEnabled && (
                <div className="fixed top-4 left-4 z-[110] flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 opacity-50"
                    style={{ padding: '0.5vh 1vw' }}>
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </div>
                    <span style={{ fontSize: '0.7vw' }} className="font-black uppercase tracking-widest text-white/80">Audio Active</span>
                </div>
            )}

            <div
                className="min-h-screen w-full text-white bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundColor: settings.theme_color,
                    backgroundImage: settings.background_header_url
                        ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${settings.background_header_url})`
                        : undefined,
                }}
            >
                <div style={{ padding: '2vh 3vw' }}>

                    {/* â”€â”€ Header â”€â”€ */}
                    <header className="mb-[2vh] rounded-2xl bg-black/30 border border-white/10 backdrop-blur-lg shadow-2xl flex items-center justify-between"
                        style={{ padding: '1.5vh 2vw', gap: '2vw' }}>

                        {/* Logo + Title */}
                        <div className="flex items-center gap-4 shrink-0">
                            <div className="rounded-2xl bg-white/10 flex items-center justify-center border border-white/10"
                                style={{ width: '4vw', height: '4vw' }}>
                                <Monitor style={{ width: '2vw', height: '2vw' }} className="text-white/80" />
                            </div>
                            <div>
                                <h1 style={{ fontSize: '2.5vw' }} className="font-black tracking-tight leading-none mb-1">
                                    {settings.screen_title}
                                </h1>
                                <p style={{ fontSize: '0.8vw' }} className="text-white/50 font-bold uppercase tracking-widest">
                                    Flight Information Display System
                                </p>
                            </div>
                        </div>

                        {/* Weather â€” compact */}
                        {settings.show_weather && weather && (
                            <div className="flex items-center gap-3 flex-1 justify-center">
                                <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl"
                                    style={{ padding: '0.8vh 1.5vw' }}>
                                    <span style={{ fontSize: '2vw' }}>🌤</span>
                                    <div>
                                        <p style={{ fontSize: '1.8vw' }} className="font-black text-yellow-300 leading-none">
                                            {weather.suhu}°C
                                        </p>
                                        <p style={{ fontSize: '0.7vw' }} className="text-yellow-400/70 font-bold uppercase tracking-wider">
                                            {weather.kondisi_cuaca}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1">
                                        <span style={{ fontSize: '0.65vw' }} className="text-white/30 uppercase font-bold">Kelembapan</span>
                                        <span style={{ fontSize: '0.75vw' }} className="text-white/60 font-black">{weather.kelembapan}%</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span style={{ fontSize: '0.65vw' }} className="text-white/30 uppercase font-bold">Angin</span>
                                        <span style={{ fontSize: '0.75vw' }} className="text-white/60 font-black">{weather.kecepatan_angin} km/h</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Clock */}
                        {settings.show_clock && (
                            <div className="bg-white/10 rounded-2xl border border-white/10 text-right shrink-0"
                                style={{ padding: '1vh 2vw' }}>
                                <p style={{ fontSize: '3vw' }} className="font-black tabular-nums tracking-tighter leading-none">{time}</p>
                                <p style={{ fontSize: '0.8vw' }} className="font-bold text-white/60 uppercase tracking-widest mt-1">{dateStr}</p>
                            </div>
                        )}
                    </header>

                    {/* â”€â”€ Main Grid â”€â”€ */}
                    <main className={`grid ${gridCols}`} style={{ gap: '2vw' }}>
                        {showFlights && (
                            <UnifiedFlightCard
                                departures={departures}
                                arrivals={arrivals}
                                showDepartures={settings.show_departures}
                                showArrivals={settings.show_arrivals}
                                kecepatan_scroll={settings.kecepatan_scroll}
                            />
                        )}
                        {showAd && <AdPanel ads={advertisements} />}
                    </main>
                </div>

                {/* Ticker Footer */}
                {settings.show_ticker && (
                    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 overflow-hidden z-50"
                        style={{ height: '5vh', display: 'flex', alignItems: 'center' }}>
                        <div style={{ fontSize: '1.3vw' }}
                            className="whitespace-nowrap animate-[marquee_30s_linear_infinite] px-8 font-bold tracking-wide">
                            {settings.ticker_text}
                        </div>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes marquee {
                    0%   { transform: translateX(100vw); }
                    100% { transform: translateX(-100%); }
                }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            ` }} />
        </>
    );
}
