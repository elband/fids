import { useEffect, useState, useCallback, useRef } from 'react';
import FidsLayout from '@/Layouts/FidsLayout';
import { PlaneTakeoff } from 'lucide-react';
import { t, type Lang } from '@/lib/fids';
import { themeGradient } from '@/lib/theme';
import { useNtpClock } from '@/hooks/useNtpClock';

interface Flight {
    id: number;
    waktu: string;
    nomor_penerbangan: string;
    maskapai: {
        nama: string;
        logo: string | null;
        warna: string;
    };
    tujuan: string;
    gate: string | null;
    checkin_counter: string | null;
    status: string;
}

const statusColors: Record<string, { bg: string; text: string; glow: string }> = {
    'Scheduled':       { bg: 'bg-transparent', text: 'text-white',       glow: '' },
    'On Time':         { bg: 'bg-transparent', text: 'text-emerald-400', glow: '' },
    'Check-in Open':   { bg: 'bg-transparent', text: 'text-sky-400',     glow: '' },
    'Check-in Closed': { bg: 'bg-transparent', text: 'text-slate-400',   glow: '' },
    'Boarding':        { bg: 'bg-transparent', text: 'text-amber-400',   glow: 'animate-pulse' },
    'Final Call':      { bg: 'bg-red-600',     text: 'text-white',       glow: 'animate-pulse' },
    'Gate Open':       { bg: 'bg-transparent', text: 'text-teal-400',    glow: '' },
    'Departed':        { bg: 'bg-transparent', text: 'text-indigo-300',  glow: '' },
    'Delayed':         { bg: 'bg-transparent', text: 'text-orange-400',  glow: '' },
    'Cancelled':       { bg: 'bg-transparent', text: 'text-red-500',     glow: '' },
};

function getStatusStyle(status: string) {
    return statusColors[status] || { bg: 'bg-transparent', text: 'text-white', glow: '' };
}

export default function Departures() {
    const [flights, setFlights] = useState<Flight[]>([]);
    const { dateText, timeText } = useNtpClock();
    const [loading, setLoading] = useState(true);
    const [bgImage, setBgImage] = useState<string | null>(null);
    // Warna tema latar dari Pengaturan Layar (default navy). Diterapkan ke seluruh papan.
    const [themeColor, setThemeColor] = useState<string>('#0f172a');
    // Warna teks papan (Pengaturan Layar): utama = jam/no.pnb/gate, aksen = judul/header/tujuan.
    const [textColor, setTextColor] = useState<string>('#ffffff');
    const [accentColor, setAccentColor] = useState<string>('#fbbf24');
    // Papan keberangkatan memakai rotasi baris (offset), bukan auto-scroll.
    // scrollSpeed tetap dibaca dari Pengaturan Layar untuk kompatibilitas data.
    const [scrollSpeed, setScrollSpeed] = useState(1);
    void scrollSpeed;
    const [weather, setWeather] = useState<{ suhu: string; kondisi_cuaca: string } | null>(null);

    const [tickerText, setTickerText] = useState('');
    const [lang, setLang] = useState<Lang>('id');

    // Bilingual header: alternates ID ↔ EN every 5s, all columns in sync
    const [headerLang, setHeaderLang] = useState<Lang>('id');
    const [headerKey, setHeaderKey] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setHeaderLang(l => l === 'id' ? 'en' : 'id');
            setHeaderKey(k => k + 1);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const [resFlights, resSettings, resWeather] = await Promise.all([
                fetch('/api/fids/departures'),
                fetch('/api/fids/settings'),
                fetch('/api/fids/weather')
            ]);
            const jsonFlights = await resFlights.json();
            const jsonSettings = await resSettings.json();

            setFlights(jsonFlights.data || []);

            if (resWeather.ok) {
                const jsonWeather = await resWeather.json();
                setWeather(jsonWeather.data);
            }
            if (jsonSettings.data?.background_header) setBgImage(jsonSettings.data.background_header);
            if (jsonSettings.data?.tema_warna) setThemeColor(jsonSettings.data.tema_warna);
            if (jsonSettings.data?.warna_utama) setTextColor(jsonSettings.data.warna_utama);
            if (jsonSettings.data?.warna_aksen) setAccentColor(jsonSettings.data.warna_aksen);
            if (jsonSettings.data?.kecepatan_scroll !== undefined) setScrollSpeed(jsonSettings.data.kecepatan_scroll);

            if (jsonSettings.data?.teks_ticker) setTickerText(jsonSettings.data.teks_ticker);
            if (jsonSettings.data?.bahasa) setLang(jsonSettings.data.bahasa);
        } catch (err) {
            console.error('Failed to fetch departures:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Track previous flights for change detection
    const prevFlightsRef = useRef<string>('');
    const [flipKey, setFlipKey] = useState(0);

    useEffect(() => {
        const sig = flights.map(f => `${f.id}:${f.status}:${f.gate}`).join('|');
        if (prevFlightsRef.current && sig !== prevFlightsRef.current) {
            setFlipKey(k => k + 1);
        }
        prevFlightsRef.current = sig;
    }, [flights]);

    // Rotasi: tiap 15 detik, baris pertama pindah ke paling bawah (shift)
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        if (flights.length <= 1) return;
        const timer = setInterval(() => {
            setOffset(o => o + 1);
            setFlipKey(k => k + 1);
        }, 15000);
        return () => clearInterval(timer);
    }, [flights.length]);

    // Hitung rotated flights berdasarkan offset
    const rotatedFlights = flights.length > 0
        ? [...flights.slice(offset % flights.length), ...flights.slice(0, offset % flights.length)]
        : [];

    return (
        <FidsLayout title="FIDS - Keberangkatan">
            <style>{`
                @keyframes score-slide-up {
                    0%   { transform: translateY(100%); opacity: 0; }
                    60%  { transform: translateY(-8%); opacity: 1; }
                    80%  { transform: translateY(3%); }
                    100% { transform: translateY(0%); opacity: 1; }
                }
                @keyframes score-row-in {
                    0%   { transform: translateY(100%); opacity: 0; }
                    50%  { transform: translateY(-3%); opacity: 1; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                @keyframes score-pulse {
                    0%, 100% { background-color: rgba(255,255,255,0.04); }
                    50%      { background-color: rgba(255,255,255,0.08); }
                }
                @keyframes header-col-in {
                    0%   { transform: translateY(110%); opacity: 0; }
                    55%  { transform: translateY(-6%);  opacity: 1; }
                    75%  { transform: translateY(2%); }
                    100% { transform: translateY(0%);   opacity: 1; }
                }
                .header-col-wrap {
                    overflow: hidden;
                    display: block;
                }
                .header-col-text {
                    display: inline-block;
                    animation: header-col-in 0.55s cubic-bezier(0.16, 0.84, 0.44, 1) both;
                }
                .score-row {
                    animation: score-row-in 0.6s cubic-bezier(0.16, 0.84, 0.44, 1) both;
                    transform-origin: bottom center;
                }
                .score-char {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    min-width: 0.55em;
                    height: 1.2em;
                    margin: 0 0.5px;
                    background: rgba(255,255,255,0.06);
                    border-radius: 3px;
                    border: 1px solid rgba(255,255,255,0.08);
                    position: relative;
                }
                .score-char::after {
                    content: '';
                    position: absolute;
                    left: 0; right: 0;
                    top: 49%;
                    height: 1px;
                    background: rgba(0,0,0,0.4);
                }
                .score-char > span {
                    display: inline-block;
                    animation: score-slide-up 0.4s cubic-bezier(0.16, 0.84, 0.44, 1) both;
                }
            `}</style>
            <div className="h-screen text-white font-sans select-none overflow-hidden flex flex-col" style={{ background: themeGradient(themeColor) }}>

                <header
                    className="relative w-full flex items-center justify-between bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 overflow-hidden shadow-lg border-b-4 border-black bg-cover bg-center"
                    style={{
                        height: '12vh',
                        paddingLeft: '2.5vw',
                        paddingRight: '2.5vw',
                        backgroundImage: bgImage ? `url(${bgImage})` : undefined
                    }}
                >
                    <div className="absolute inset-0 bg-black/30"></div>

                    <div className="relative z-10 flex items-center gap-[1vw] min-w-0 w-[30%]">
                        <PlaneTakeoff style={{ width: '3.5vw', height: '3.5vw', flexShrink: 0, color: accentColor }} className="drop-shadow" />
                        <h1 style={{ fontSize: '3.5vw', color: textColor }} className="font-extrabold tracking-tighter drop-shadow-lg leading-none whitespace-nowrap">
                            {t.departures[lang]}
                        </h1>
                    </div>

                    <div className="w-[40%]"></div>

                    <div className="relative z-10 text-right w-[30%]">
                        {weather && (
                            <div style={{ fontSize: '1.3vw', color: accentColor }} className="font-medium drop-shadow whitespace-nowrap">
                                {weather.suhu}°C <span className="mx-1">•</span> {weather.kondisi_cuaca}
                            </div>
                        )}
                        <div style={{ fontSize: '1.6vw', color: textColor }} className="font-bold tracking-wide mt-1 drop-shadow whitespace-nowrap font-mono">
                            <ScoreChars text={`${dateText} | ${timeText}`} baseDelay={0} />
                        </div>
                    </div>
                </header>

                {/* Header kolom */}
                <div className="w-full bg-gradient-to-b from-gray-900 to-black border-b border-yellow-500/30">
                    <div className="grid grid-cols-12 gap-4" style={{ paddingLeft: '2.5vw', paddingRight: '2.5vw', paddingTop: '1vh', paddingBottom: '1vh' }}>
                        <div style={{ fontSize: '0.9vw', color: accentColor }} className="col-span-2 font-black text-yellow-500 tracking-[0.3em] uppercase header-col-wrap">
                            <span key={`airline-${headerKey}`} className="header-col-text">{t.colAirline[headerLang]}</span>
                        </div>
                        <div style={{ fontSize: '0.9vw', color: accentColor }} className="col-span-1 font-black text-yellow-500 tracking-[0.3em] uppercase header-col-wrap">
                            <span key={`sched-${headerKey}`} className="header-col-text" style={{ animationDelay: '40ms' }}>{t.colScheduled[headerLang]}</span>
                        </div>
                        <div style={{ fontSize: '0.9vw', color: accentColor }} className="col-span-2 font-black text-yellow-500 tracking-[0.3em] uppercase header-col-wrap">
                            <span key={`flight-${headerKey}`} className="header-col-text" style={{ animationDelay: '80ms' }}>{t.colFlight[headerLang]}</span>
                        </div>
                        <div style={{ fontSize: '0.9vw', color: accentColor }} className="col-span-4 font-black text-yellow-500 tracking-[0.3em] uppercase header-col-wrap">
                            <span key={`dest-${headerKey}`} className="header-col-text" style={{ animationDelay: '120ms' }}>{t.colDestination[headerLang]}</span>
                        </div>
                        <div style={{ fontSize: '0.9vw', color: accentColor }} className="col-span-1 font-black text-yellow-500 tracking-[0.3em] uppercase text-center header-col-wrap">
                            <span key={`gate-${headerKey}`} className="header-col-text" style={{ animationDelay: '160ms' }}>{t.colGate[headerLang]}</span>
                        </div>
                        <div style={{ fontSize: '0.9vw', color: accentColor }} className="col-span-2 font-black text-yellow-500 tracking-[0.3em] uppercase text-right header-col-wrap">
                            <span key={`status-${headerKey}`} className="header-col-text" style={{ animationDelay: '200ms' }}>{t.colStatus[headerLang]}</span>
                        </div>
                    </div>
                </div>

                {/* Baris penerbangan â€” animasi scoreboard badminton */}
                <div className="flex-1 overflow-hidden relative">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div style={{ fontSize: '1.5vw' }} className="text-yellow-500 font-bold animate-pulse tracking-widest">
                                {t.loading[lang]}
                            </div>
                        </div>
                    ) : flights.length === 0 ? (
                        <div style={{ fontSize: '1.5vw' }} className="text-center py-20 text-gray-500 font-bold tracking-widest uppercase">
                            {t.noFlightsDep[lang]}
                        </div>
                    ) : (
                        rotatedFlights.map((flight, idx) => {
                            const style = getStatusStyle(flight.status);
                            return (
                                <div
                                    key={`${flight.id}-${flipKey}`}
                                    className={`score-row grid grid-cols-12 gap-4 items-center border-b border-white/[0.06] group ${
                                        idx % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'
                                    }`}
                                    style={{
                                        paddingLeft: '2.5vw',
                                        paddingRight: '2.5vw',
                                        paddingTop: '1vh',
                                        paddingBottom: '1vh',
                                        animationDelay: `${idx * 100}ms`,
                                    }}
                                >
                                    {/* Maskapai logo */}
                                    <div className="col-span-2">
                                        <div className="bg-white rounded-lg flex items-center justify-center shadow-md"
                                            style={{ height: '5.5vh', maxWidth: '10vw', padding: '0.4vh 0.6vw' }}>
                                            {flight.maskapai?.logo ? (
                                                <img src={flight.maskapai.logo} alt={flight.maskapai.nama} className="max-h-full w-auto object-contain" />
                                            ) : (
                                                <span style={{ fontSize: '0.8vw' }} className="font-black text-gray-800 tracking-widest uppercase">{flight.maskapai?.nama}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Waktu â€” scoreboard chars */}
                                    <div style={{ fontSize: '1.8vw', color: textColor }} className="col-span-1 font-black tracking-tight font-mono">
                                        <ScoreChars text={flight.waktu} baseDelay={idx * 100 + 100} />
                                    </div>

                                    {/* Nomor penerbangan */}
                                    <div style={{ fontSize: '1.5vw', color: textColor, opacity: 0.85 }} className="col-span-2 font-bold tracking-tight">
                                        <ScoreChars text={flight.nomor_penerbangan} baseDelay={idx * 100 + 200} />
                                    </div>

                                    {/* Tujuan */}
                                    <div style={{ fontSize: '2.2vw', color: accentColor }} className="col-span-4 font-black tracking-tight truncate pr-4 drop-shadow-sm uppercase">
                                        <ScoreChars text={flight.tujuan} baseDelay={idx * 100 + 150} />
                                    </div>

                                    {/* Gate */}
                                    <div style={{ fontSize: '1.4vw', color: textColor }} className="col-span-1 font-black text-center">
                                        <ScoreChars text={flight.gate || '-'} baseDelay={idx * 100 + 300} />
                                    </div>

                                    {/* Status â€” scoreboard */}
                                    <div className="col-span-2 flex justify-end">
                                        <span
                                            style={{ fontSize: '0.85vw', padding: '0.6vh 0.5vw' }}
                                            className={`font-black tracking-[0.15em] uppercase ${
                                                flight.status === 'Boarding' || flight.status === 'Final Call'
                                                    ? 'text-amber-300'
                                                    : flight.status === 'Departed'
                                                        ? 'text-emerald-400'
                                                        : flight.status === 'Delayed'
                                                            ? 'text-orange-400'
                                                            : flight.status === 'Cancelled'
                                                                ? 'text-red-400'
                                                                : 'text-white/60'
                                            } ${style.glow}`}
                                        >
                                            <ScoreChars text={flight.status} baseDelay={idx * 100 + 350} />
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Ticker */}
                <footer className="bg-black border-t-2 border-yellow-500/30 flex items-center overflow-hidden" style={{ height: '5vh' }}>
                    <div style={{ fontSize: '1.2vw', padding: '0 1.5vw' }} className="bg-yellow-500 text-black font-black h-full flex items-center shrink-0 z-10 shadow-lg tracking-widest">
                        {t.info[lang]}
                    </div>
                    <div className="w-full relative h-full flex items-center">
                        <div style={{ fontSize: '1.2vw', color: textColor }} className="whitespace-nowrap absolute font-semibold tracking-widest animate-[ticker_25s_linear_infinite]">
                            {tickerText}
                        </div>
                    </div>
                </footer>
            </div>
        </FidsLayout>
    );
}


/**
 * ScoreChars â€” animasi papan score badminton.
 * Setiap karakter dalam kotak kecil, muncul slide dari bawah ke atas secara berurutan.
 */
function ScoreChars({ text, baseDelay = 0 }: { text?: string | null; baseDelay?: number }) {
    // Field bisa null/undefined dari API (mis. status/waktu kosong) — jangan sampai
    // `.split()` melempar dan menjatuhkan seluruh papan keberangkatan.
    const safeText = text ?? '';
    return (
        <>
            {safeText.split('').map((char, i) => (
                <span key={i} className="score-char">
                    <span style={{ animationDelay: `${baseDelay + i * 40}ms` }}>
                        {char === ' ' ? '\u00A0' : char}
                    </span>
                </span>
            ))}
        </>
    );
}
