import AirlineLogo from '@/Components/AirlineLogo';
import { useEffect, useState, useCallback, useRef } from 'react';
import FidsLayout from '@/Layouts/FidsLayout';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { hexToRgba, tickerDuration, TICKER_SPEED_DEFAULT, t, type Lang } from '@/lib/fids';
import { useNtpClock } from '@/hooks/useNtpClock';

const DEPARTED_HIDE_MS = 5 * 60 * 1000; // 5 menit

/**
 * Chip status untuk penerbangan yang sedang memakai gate. 'Check-in Open' dan
 * 'Departed' punya blok sendiri di bawah, jadi tidak masuk peta ini.
 * Status pasif (Scheduled/On Time) sengaja tanpa chip: tidak ada yang perlu
 * diberitahukan ke penumpang selain jam yang sudah tampil besar.
 */
const OCCUPANT_BADGE: Record<string, { id: string; en: string; cls: string }> = {
    'Boarding':        { id: 'BOARDING',      en: 'BOARDING',      cls: 'bg-green-400 text-black' },
    'Gate Open':       { id: 'GATE DIBUKA',   en: 'GATE OPEN',     cls: 'bg-green-400 text-black' },
    'Final Call':      { id: 'PANGGILAN AKHIR', en: 'FINAL CALL',  cls: 'bg-orange-400 text-black animate-pulse' },
    'Gate Closed':     { id: 'GATE DITUTUP',  en: 'GATE CLOSED',   cls: 'bg-gray-300 text-black' },
    'Check-in Closed': { id: 'CHECK-IN TUTUP', en: 'CHECK-IN CLOSED', cls: 'bg-gray-300 text-black' },
    'Delayed':         { id: 'DITUNDA',       en: 'DELAYED',       cls: 'bg-red-500 text-white' },
};

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
    /** Penerbangan terjadwal berikutnya; hanya dikirim saat gate sedang kosong. */
    upcoming_flight?: Flight | null;
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
    const [tickerSpeed, setTickerSpeed] = useState(TICKER_SPEED_DEFAULT);
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
            const presentIds = new Set<number>();
            newGates.forEach(gate => {
                (gate.flights ?? []).forEach(flight => {
                    presentIds.add(flight.id);
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

            // Pangkas flight yang sudah hilang total dari respons (mis. akhir hari)
            // agar map tidak menumpuk selama kiosk menyala 24/7.
            Object.keys(departedAtRef.current).forEach(idStr => {
                if (!presentIds.has(Number(idStr))) {
                    delete departedAtRef.current[Number(idStr)];
                }
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
            if (jsonSettings.data?.kecepatan_running_text) setTickerSpeed(jsonSettings.data.kecepatan_running_text);
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
                    opacity: 0.65;
                    filter: grayscale(45%);
                    transition: opacity 0.5s;
                }
            `}</style>
            <div className="h-screen bg-black text-white font-sans select-none overflow-hidden flex flex-col">
                <header
                    className="relative w-full min-h-24 shrink-0 flex items-center justify-between gap-4 px-8 py-3 bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 overflow-hidden shadow-lg border-b-2 border-black bg-cover bg-center"
                    style={{ backgroundImage: bgImage ? `url(${bgImage})` : undefined }}
                >
                    {!bgImage && <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>}
                    <div className="absolute inset-0 bg-black/30"></div>
                    <div className="relative z-10 min-w-0 flex-1">
                        <h1
                            className="text-[clamp(1.75rem,4vw,4rem)] leading-tight font-black tracking-tight text-yellow-400 whitespace-nowrap overflow-hidden text-ellipsis"
                            /* Foto header bisa terang (langit siang); tanpa garis luar gelap
                               teks emas ikut tenggelam saat dilihat dari jauh. */
                            style={{ WebkitTextStroke: '1px rgba(0,0,0,0.65)', paintOrder: 'stroke fill', textShadow: '0 3px 2px rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.9)' }}
                        >
                            {t.boardingGates[lang]}
                        </h1>
                    </div>
                    <div className="relative z-10 shrink-0 text-right">
                        {weather && (
                            <div className="text-[clamp(0.75rem,1.3vw,1.25rem)] leading-tight font-medium text-yellow-400 drop-shadow whitespace-nowrap">
                                {weather.suhu}°C <span className="mx-2">•</span> {weather.kondisi_cuaca}
                            </div>
                        )}
                        <div className="text-[clamp(0.9rem,1.7vw,1.5rem)] leading-tight font-bold tracking-wide mt-1 drop-shadow whitespace-nowrap">
                            {dateText} <span className="mx-2">|</span> {timeText}
                        </div>
                    </div>
                </header>

                <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto scrollbar-hide relative bg-black">
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
                                // Backend sudah mengurutkan penghuni gate di posisi pertama
                                // (prioritas status, baru jam jadwal), jadi warna kartu cukup
                                // mengikuti elemen pertama.
                                const primaryFlight = visibleFlights[0] ?? null;

                                // Kartu dibaca penumpang dari belasan meter: yang menentukan
                                // keterbacaan adalah beda terang kartu vs latar hitam, bukan
                                // saturasi. Alpha rendah membuat tepi kartu lenyap dari jauh,
                                // jadi setiap keadaan dipatok ke blok warna yang jelas padat.
                                const rowColor = (() => {
                                    if (!gate.status_gate || gate.status_gate !== 'aktif') return '';
                                    if (hasCheckin && !hasActive) return 'rgba(8, 145, 178, 0.75)';
                                    if (allDeparted) return 'rgba(51, 55, 68, 0.85)';
                                    if (primaryFlight?.maskapai?.warna) return hexToRgba(primaryFlight.maskapai.warna, 0.65);
                                    return 'rgba(13, 148, 136, 0.7)';
                                })();

                                const borderClass = (() => {
                                    if (gate.status_gate !== 'aktif') return 'bg-gray-900 border-gray-500';
                                    if (hasCheckin && !hasActive) return 'border-cyan-300 shadow-lg shadow-cyan-400/40';
                                    if (allDeparted) return 'border-gray-400/70';
                                    return 'border-teal-300/80 shadow-lg shadow-teal-400/30';
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
                                            <span className="text-base text-gray-200 font-bold tracking-widest uppercase">{t.gate[lang]}</span>
                                            <span className={`text-6xl font-black leading-none ${
                                                hasCheckin && !hasActive ? 'text-cyan-300' :
                                                gate.status_gate === 'aktif' ? 'text-yellow-400' : 'text-gray-600'
                                            }`}>
                                                {/* Nama gate yang dikenal penumpang ("Gate A1"), bukan kode internal ("01"). */}
                                                {gate.nama_gate || gate.kode_gate}
                                            </span>
                                            {gate.petunjuk_arah && (
                                                <span className="text-5xl leading-none text-[#ff2020] drop-shadow-[0_0_8px_rgba(255,32,32,0.85)] mt-1">
                                                    {gate.petunjuk_arah}
                                                </span>
                                            )}
                                        </div>

                                        {/* Panel kanan — info penerbangan */}
                                        <div className="w-3/4 flex flex-col justify-center p-4 relative gap-2">
                                            {gate.status_gate !== 'aktif' ? (
                                                <div className="text-3xl font-bold tracking-widest uppercase text-yellow-400 text-center">
                                                    {t.closed[lang]}
                                                </div>
                                            ) : visibleFlights.length === 0 ? (
                                                // Gate kosong. Bila masih ada jadwal berikutnya hari ini,
                                                // jamnya jauh lebih berguna bagi penumpang yang berdiri di
                                                // depan gate daripada sekadar kalimat menunggu.
                                                gate.upcoming_flight ? (
                                                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                                                        <span className="text-sm font-black tracking-[0.2em] uppercase text-teal-100/80">
                                                            {t.nextFlight[lang]}
                                                        </span>
                                                        {gate.upcoming_flight.maskapai?.logo && (
                                                            <div className="bg-white rounded py-1 px-2 h-10 w-28 shrink-0 flex items-center justify-center">
                                                                <AirlineLogo src={gate.upcoming_flight.maskapai.logo} name={gate.upcoming_flight.maskapai.nama ?? 'Maskapai'} />
                                                            </div>
                                                        )}
                                                        <div className="flex items-baseline justify-center gap-4 flex-wrap">
                                                            <span className="text-4xl font-black tracking-wider tabular-nums text-white">
                                                                {gate.upcoming_flight.jam_jadwal?.substring(0, 5) ?? '--:--'}
                                                            </span>
                                                            <span className="text-2xl font-black tracking-widest text-teal-50">
                                                                {gate.upcoming_flight.nomor_penerbangan}
                                                            </span>
                                                        </div>
                                                        <span className="text-2xl font-bold truncate max-w-full text-yellow-200">
                                                            {gate.upcoming_flight.tujuan}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="text-2xl font-bold tracking-widest uppercase text-teal-50 text-center">
                                                        {t.awaitingNextFlight[lang]}
                                                    </div>
                                                )
                                            ) : (
                                                <>
                                                    {/* -- Penghuni gate saat ini: elemen pertama dari API,
                                                         sudah diurutkan prioritas status oleh backend. -- */}
                                                    {(() => {
                                                        const fl = visibleFlights[0];
                                                        const isCO = fl.status === 'Check-in Open';
                                                        const isDep = fl.status === 'Departed';
                                                        return (
                                                            <>
                                                                <div className="flex justify-between items-center">
                                                                    <div className="bg-white rounded py-1 px-3 h-12 w-40 max-w-full flex items-center justify-center shadow-inner">
                                                                        {fl.maskapai?.logo ? (
                                                                            <AirlineLogo src={fl.maskapai.logo} name={fl.maskapai.nama ?? 'Maskapai'} />
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
                                                                        isCO ? 'text-cyan-50' : 'text-yellow-300'
                                                                    }`}>
                                                                        {fl.tujuan}
                                                                    </div>
                                                                    <div className="text-2xl font-bold tracking-wider">
                                                                        {fl.jam_jadwal?.substring(0, 5) ?? '--:--'}
                                                                    </div>
                                                                </div>
                                                                {OCCUPANT_BADGE[fl.status] && (
                                                                    <div className="mt-1">
                                                                        <span className={`px-3 py-1 rounded-full text-sm font-black tracking-widest uppercase ${OCCUPANT_BADGE[fl.status].cls}`}>
                                                                            {OCCUPANT_BADGE[fl.status][lang]}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {isCO && (
                                                                    <div className="checkin-badge flex items-center gap-3 mt-1 pt-2 border-t border-cyan-400/30">
                                                                        <span className="px-3 py-1 rounded-full bg-cyan-400 text-black text-xs font-black tracking-widest uppercase animate-pulse">
                                                                            {lang === 'id' ? 'CHECK-IN DIBUKA' : 'CHECK-IN OPEN'}
                                                                        </span>
                                                                        {fl.checkin_counter && (
                                                                            <span className="text-cyan-50 text-base font-bold tracking-wide">
                                                                                {lang === 'id' ? 'Menuju Counter' : 'Proceed to Counter'}{' '}
                                                                                <span className="text-white font-black text-base">{fl.checkin_counter}</span>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {isDep && (
                                                                    <div className="mt-1">
                                                                        <span className="text-sm font-black tracking-widest uppercase text-gray-100 bg-gray-600/80 border border-gray-300/70 px-3 py-1 rounded">
                                                                            {lang === 'id' ? 'BERANGKAT' : 'DEPARTED'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}

                                                    {/* -- Antrian: penerbangan lain di gate yang sama. Sengaja
                                                         jauh lebih kecil dari penghuni di atas supaya penumpang
                                                         tidak salah membaca siapa yang boarding sekarang. -- */}
                                                    {visibleFlights.length > 1 && (
                                                        <div className="mt-2 pt-2 border-t-2 border-white/30 flex flex-col gap-1.5">
                                                            <span className="text-xs font-black tracking-[0.2em] uppercase text-white/80">
                                                                {t.nextUp[lang]}
                                                            </span>
                                                            {visibleFlights.slice(1).map(fl => {
                                                                const isCO = fl.status === 'Check-in Open';
                                                                const isDep = fl.status === 'Departed';
                                                                return (
                                                                    <div
                                                                        key={fl.id}
                                                                        className={`flex flex-wrap items-center gap-3 ${isDep ? 'opacity-70' : ''}`}
                                                                    >
                                                                        <span className="text-lg font-bold tracking-wider shrink-0 tabular-nums">
                                                                            {fl.jam_jadwal?.substring(0, 5) ?? '--:--'}
                                                                        </span>
                                                                        {fl.maskapai?.logo && (
                                                                            <div className="bg-white rounded py-1 px-2 h-8 w-24 shrink-0 flex items-center justify-center">
                                                                                <AirlineLogo src={fl.maskapai.logo} name={fl.maskapai.nama ?? 'Maskapai'} />
                                                                            </div>
                                                                        )}
                                                                        <span className="text-lg font-black tracking-widest shrink-0">
                                                                            {fl.nomor_penerbangan}
                                                                        </span>
                                                                        <span className={`text-lg font-bold truncate flex-1 ${
                                                                            isCO ? 'text-cyan-50' : isDep ? 'text-gray-200' : 'text-yellow-100'
                                                                        }`}>
                                                                            {fl.tujuan}
                                                                        </span>
                                                                        {isCO && (
                                                                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-cyan-400 text-black text-xs font-black tracking-widest uppercase">
                                                                                CHECK-IN
                                                                            </span>
                                                                        )}
                                                                        {isDep && (
                                                                            <span className="shrink-0 text-xs font-black tracking-widest uppercase text-gray-100 bg-gray-600/80 border border-gray-300/70 px-2 py-0.5 rounded">
                                                                                {lang === 'id' ? 'BERANGKAT' : 'DEPARTED'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {tickerText && (
                    <footer className="h-12 shrink-0 bg-black border-t border-gray-800 flex items-center overflow-hidden">
                        <div className="bg-yellow-500 text-black font-bold px-6 h-full flex items-center shrink-0 z-10 shadow-lg">
                            {t.info[lang]}
                        </div>
                        <div className="w-full relative h-full flex items-center">
                            <div style={{ animationDuration: tickerDuration(tickerSpeed) }} className="whitespace-nowrap absolute font-semibold text-white tracking-widest text-lg animate-[ticker_linear_infinite]">
                                {tickerText}
                            </div>
                        </div>
                    </footer>
                )}
            </div>
        </FidsLayout>
    );
}
