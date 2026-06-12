import { useEffect, useState, useCallback, useRef } from 'react';
import FidsLayout from '@/Layouts/FidsLayout';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { hexToRgba, t, type Lang } from '@/lib/fids';
import { useNtpClock } from '@/hooks/useNtpClock';

const DEPARTED_HIDE_MS = 5 * 60 * 1000; // 5 menit

interface Flight {
    id: number;
    jam_jadwal: string;
    nomor_penerbangan: string;
    tujuan: string;
    status: string;
    checkin_counter: string | null;
    maskapai: {
        nama: string | null;
        logo: string | null;
        warna: string;
    };
}

interface Gate {
    id: number;
    kode_gate: string;
    nama_gate: string;
    status_gate: string;
    terminal: string;
    petunjuk_arah: string | null;
    flights?: Flight[];
}

export default function BoardingGateDisplay() {
    const [gates, setGates] = useState<Gate[]>([]);
    const { dateText, timeText } = useNtpClock();
    const [loading, setLoading] = useState(true);
    const [scrollSpeed, setScrollSpeed] = useState(1);
    const scrollRef = useAutoScroll(scrollSpeed, 4000, [gates]);
    const [weather, setWeather] = useState<{ suhu: string; kondisi_cuaca: string } | null>(null);
    const [bgImage, setBgImage] = useState<string | null>(null);
    const [tickerText, setTickerText] = useState('');
    const [lang, setLang] = useState<Lang>('id');

    // Track kapan flight pertama kali berstatus "Departed" { flightId: timestamp }
    const departedAtRef = useRef<Record<number, number>>({});
    // Set flight ID yang sudah melewati 5 menit departed → disembunyikan
    const [hiddenFlightIds, setHiddenFlightIds] = useState<Set<number>>(new Set());

    const fetchData = useCallback(async () => {
        try {
            const [resGates, resSettings, resWeather] = await Promise.all([
                fetch('/api/fids/gates'),
                fetch('/api/fids/settings'),
                fetch('/api/fids/weather')
            ]);
            const jsonGates = await resGates.json();
            const jsonSettings = await resSettings.json();

            const newGates: Gate[] = jsonGates.data || [];
            setGates(newGates);

            // Lacak waktu "Departed" untuk setiap flight
            const now = Date.now();
            newGates.forEach(gate => {
                (gate.flights ?? []).forEach(flight => {
                    if (flight.status === 'Departed') {
                        if (!departedAtRef.current[flight.id]) {
                            departedAtRef.current[flight.id] = now;
                        }
                    } else {
                        // Reset jika status berubah dari Departed
                        delete departedAtRef.current[flight.id];
                    }
                });
            });

            // Sembunyikan flight yang sudah departed > 5 menit
            const newHidden = new Set<number>();
            Object.entries(departedAtRef.current).forEach(([idStr, ts]) => {
                if (now - ts >= DEPARTED_HIDE_MS) {
                    newHidden.add(Number(idStr));
                }
            });
            setHiddenFlightIds(newHidden);

            if (resWeather.ok) {
                const jsonWeather = await resWeather.json();
                setWeather(jsonWeather.data);
            }
            if (jsonSettings.data?.background_header) setBgImage(jsonSettings.data.background_header);
            if (jsonSettings.data?.kecepatan_scroll !== undefined) setScrollSpeed(jsonSettings.data.kecepatan_scroll);
            if (jsonSettings.data?.teks_ticker) setTickerText(jsonSettings.data.teks_ticker);
            if (jsonSettings.data?.bahasa) setLang(jsonSettings.data.bahasa);
        } catch (err) {
            console.error('Failed to fetch gates:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [fetchData]);

    return (
        <FidsLayout title="FIDS - Boarding Gate">
            <style>{`
                @keyframes checkin-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%      { opacity: 0.75; transform: scale(1.02); }
                }
                @keyframes checkin-badge-in {
                    0%   { opacity: 0; transform: translateY(6px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes departed-fade {
                    0%   { opacity: 1; }
                    80%  { opacity: 0.25; }
                    100% { opacity: 0; }
                }
                .checkin-open-card {
                    animation: checkin-pulse 2.5s ease-in-out infinite;
                }
                .checkin-badge {
                    animation: checkin-badge-in 0.4s ease both;
                }
                .departed-card {
                    opacity: 0.4;
                    filter: grayscale(60%);
                    transition: opacity 0.5s;
                }
            `}</style>
            <div className="h-screen bg-black text-white font-sans select-none overflow-hidden flex flex-col">
                <header
                    className="relative w-full h-24 flex items-center justify-between px-8 bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 overflow-hidden shadow-lg border-b-2 border-black bg-cover bg-center"
                    style={{ backgroundImage: bgImage ? `url(${bgImage})` : undefined }}
                >
                    {!bgImage && <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>}
                    <div className="absolute inset-0 bg-black/30"></div>
                    <div className="relative z-10 w-1/3">
                        <h1 className="text-4xl font-extrabold tracking-tighter text-white drop-shadow-lg">
                            {t.boardingGates[lang]}
                        </h1>
                    </div>
                    <div className="relative z-10 w-1/3 text-right">
                        {weather && (
                            <div className="text-xl font-medium text-yellow-400 drop-shadow">
                                {weather.suhu}°C <span className="mx-2">•</span> {weather.kondisi_cuaca}
                            </div>
                        )}
                        <div className="text-2xl font-bold tracking-wide mt-1 drop-shadow">
                            {dateText} <span className="mx-2">|</span> {timeText}
                        </div>
                    </div>
                </header>

                <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide relative bg-black">
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-yellow-500 font-bold text-xl animate-pulse tracking-widest">
                            {t.loading[lang]}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-max h-full p-6">
                            {gates.map(gate => {
                                const visibleFlights = (gate.flights ?? []).filter(f => !hiddenFlightIds.has(f.id));
                                const hasCheckin  = visibleFlights.some(f => f.status === 'Check-in Open');
                                const hasActive   = visibleFlights.some(f => !['Check-in Open', 'Departed'].includes(f.status));
                                const allDeparted = visibleFlights.length > 0 && visibleFlights.every(f => f.status === 'Departed');
                                const primaryFlight =
                                    visibleFlights.find(f => !['Check-in Open', 'Departed'].includes(f.status)) ??
                                    visibleFlights.find(f => f.status === 'Check-in Open') ??
                                    visibleFlights[0] ?? null;

                                const rowColor = (() => {
                                    if (!gate.status_gate || gate.status_gate !== 'aktif') return '';
                                    if (hasCheckin && !hasActive) return 'rgba(14, 116, 144, 0.55)';
                                    if (allDeparted) return 'rgba(30, 30, 40, 0.8)';
                                    if (primaryFlight?.maskapai?.warna) return hexToRgba(primaryFlight.maskapai.warna, 0.4);
                                    return 'rgba(13, 148, 136, 0.2)';
                                })();

                                const borderClass = (() => {
                                    if (gate.status_gate !== 'aktif') return 'bg-gray-900 border-gray-800';
                                    if (hasCheckin && !hasActive) return 'border-cyan-400/60 shadow-lg shadow-cyan-500/20';
                                    if (allDeparted) return 'border-gray-700/40';
                                    return 'border-teal-900/50 shadow-lg shadow-teal-900/20';
                                })();

                                return (
                                    <div
                                        key={gate.id}
                                        className={`rounded-xl border-2 flex overflow-hidden transition-all duration-500 min-h-40 ${
                                            hasCheckin && !hasActive ? 'checkin-open-card' : ''
                                        } ${allDeparted ? 'departed-card' : ''} ${borderClass}`}
                                        style={{ backgroundColor: rowColor }}
                                    >
                                        {/* Panel kiri — kode gate */}
                                        <div className="w-1/4 bg-black flex flex-col items-center justify-center border-r border-black/50 p-4 gap-1">
                                            <span className="text-sm text-gray-400 font-bold tracking-widest uppercase">{t.gate[lang]}</span>
                                            <span className={`text-6xl font-black leading-none ${
                                                hasCheckin && !hasActive ? 'text-cyan-300' :
                                                gate.status_gate === 'aktif' ? 'text-yellow-400' : 'text-gray-600'
                                            }`}>
                                                {gate.kode_gate}
                                            </span>
                                            {gate.petunjuk_arah && (
                                                <span className="text-5xl leading-none text-amber-300 mt-1">
                                                    {gate.petunjuk_arah}
                                                </span>
                                            )}
                                        </div>

                                        {/* Panel kanan — info penerbangan */}
                                        <div className="w-3/4 flex flex-col justify-center p-4 relative gap-2">
                                            {gate.status_gate !== 'aktif' ? (
                                                <div className="text-3xl font-bold tracking-widest uppercase text-gray-600 text-center opacity-50">
                                                    {t.closed[lang]}
                                                </div>
                                            ) : visibleFlights.length === 0 ? (
                                                <div className="text-2xl font-bold tracking-widest uppercase text-gray-400 text-center">
                                                    {t.noAssignedFlights[lang]}
                                                </div>
                                            ) : visibleFlights.length === 1 ? (
                                                // ── Satu penerbangan: tampilan besar ──
                                                (() => {
                                                    const fl = visibleFlights[0];
                                                    const isCO = fl.status === 'Check-in Open';
                                                    const isDep = fl.status === 'Departed';
                                                    return (
                                                        <>
                                                            <div className="flex justify-between items-center">
                                                                <div className="bg-white rounded py-1 px-3 h-12 flex items-center shadow-inner max-w-[160px]">
                                                                    {fl.maskapai?.logo ? (
                                                                        <img src={fl.maskapai.logo} className="max-h-8 w-auto object-contain" alt="logo" />
                                                                    ) : (
                                                                        <span className="font-bold text-gray-800 text-sm">{fl.maskapai?.nama}</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-3xl font-black tracking-widest">
                                                                    {fl.nomor_penerbangan}
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-between items-end">
                                                                <div className={`text-4xl font-bold truncate pr-4 drop-shadow-md ${
                                                                    isCO ? 'text-cyan-200' : 'text-yellow-400'
                                                                }`}>
                                                                    {fl.tujuan}
                                                                </div>
                                                                <div className="text-2xl font-bold tracking-wider">
                                                                    {fl.jam_jadwal.substring(0, 5)}
                                                                </div>
                                                            </div>
                                                            {isCO && (
                                                                <div className="checkin-badge flex items-center gap-3 mt-1 pt-2 border-t border-cyan-400/30">
                                                                    <span className="px-3 py-1 rounded-full bg-cyan-400 text-black text-xs font-black tracking-widest uppercase animate-pulse">
                                                                        {lang === 'id' ? 'CHECK-IN DIBUKA' : 'CHECK-IN OPEN'}
                                                                    </span>
                                                                    {fl.checkin_counter && (
                                                                        <span className="text-cyan-200 text-sm font-bold tracking-wide">
                                                                            {lang === 'id' ? 'Menuju Counter' : 'Proceed to Counter'}{' '}
                                                                            <span className="text-white font-black text-base">{fl.checkin_counter}</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {isDep && (
                                                                <div className="mt-1">
                                                                    <span className="text-xs font-black tracking-widest uppercase text-gray-500 border border-gray-700 px-2 py-0.5 rounded">
                                                                        {lang === 'id' ? 'BERANGKAT' : 'DEPARTED'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()
                                            ) : (
                                                // ── Beberapa penerbangan: daftar kompak ──
                                                <div className="flex flex-col gap-2 w-full">
                                                    {visibleFlights.map((fl, idx) => {
                                                        const isCO  = fl.status === 'Check-in Open';
                                                        const isDep = fl.status === 'Departed';
                                                        return (
                                                            <div
                                                                key={fl.id}
                                                                className={`flex flex-col gap-0.5 ${idx > 0 ? 'border-t border-white/10 pt-2' : ''} ${isDep ? 'opacity-40 grayscale' : ''}`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className="bg-white rounded py-0.5 px-2 h-8 flex items-center shadow-inner max-w-[100px] shrink-0">
                                                                        {fl.maskapai?.logo ? (
                                                                            <img src={fl.maskapai.logo} className="max-h-6 w-auto object-contain" alt="logo" />
                                                                        ) : (
                                                                            <span className="font-bold text-gray-800 text-xs">{fl.maskapai?.nama}</span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-lg font-black tracking-widest shrink-0">
                                                                        {fl.nomor_penerbangan}
                                                                    </span>
                                                                    <span className={`text-xl font-bold truncate flex-1 ${
                                                                        isCO ? 'text-cyan-200' : isDep ? 'text-gray-400' : 'text-yellow-400'
                                                                    }`}>
                                                                        {fl.tujuan}
                                                                    </span>
                                                                    <span className="text-lg font-bold tracking-wider shrink-0">
                                                                        {fl.jam_jadwal.substring(0, 5)}
                                                                    </span>
                                                                </div>
                                                                {isCO && (
                                                                    <div className="checkin-badge flex items-center gap-2 flex-wrap pl-1">
                                                                        <span className="px-2 py-0.5 rounded-full bg-cyan-400 text-black text-xs font-black tracking-widest uppercase animate-pulse">
                                                                            {lang === 'id' ? 'CHECK-IN DIBUKA' : 'CHECK-IN OPEN'}
                                                                        </span>
                                                                        {fl.checkin_counter && (
                                                                            <span className="text-cyan-200 text-xs font-bold tracking-wide">
                                                                                {lang === 'id' ? 'Counter' : 'Counter'}{' '}
                                                                                <span className="text-white font-black text-sm">{fl.checkin_counter}</span>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {isDep && (
                                                                    <div className="pl-1">
                                                                        <span className="text-xs font-black tracking-widest uppercase text-gray-500 border border-gray-700 px-2 py-0.5 rounded">
                                                                            {lang === 'id' ? 'BERANGKAT' : 'DEPARTED'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {tickerText && (
                    <footer className="h-12 bg-black border-t border-gray-800 flex items-center overflow-hidden">
                        <div className="bg-yellow-500 text-black font-bold px-6 h-full flex items-center shrink-0 z-10 shadow-lg">
                            {t.info[lang]}
                        </div>
                        <div className="w-full relative h-full flex items-center">
                            <div className="whitespace-nowrap absolute font-semibold text-white tracking-widest text-lg animate-[ticker_25s_linear_infinite]">
                                {tickerText}
                            </div>
                        </div>
                    </footer>
                )}
            </div>
        </FidsLayout>
    );
}
