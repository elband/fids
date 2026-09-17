import '../../../css/boarding-gate.css';
import AirlineLogo from '@/Components/AirlineLogo';
import CounterArrow from '@/Components/Taxi/CounterArrow';
import { useEffect, useState, useCallback } from 'react';
import FidsLayout from '@/Layouts/FidsLayout';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { tickerDuration, TICKER_SPEED_DEFAULT, t, type Lang } from '@/lib/fids';
import { useNtpClock } from '@/hooks/useNtpClock';

/**
 * Chip status untuk penerbangan yang sedang memakai gate. 'Check-in Open' dan
 * 'Departed' punya blok sendiri di bawah, jadi tidak masuk peta ini.
 * Status pasif (Scheduled/On Time) sengaja tanpa chip: tidak ada yang perlu
 * diberitahukan ke penumpang selain jam yang sudah tampil besar.
 */
const OCCUPANT_BADGE: Record<string, { id: string; en: string; cls: string }> = {
    'Boarding':        { id: 'BOARDING',      en: 'BOARDING',      cls: 'bg-green-400 text-black' },
    'Gate Open':       { id: 'GATE DIBUKA',   en: 'GATE OPEN',     cls: 'bg-green-400 text-black' },
    'Final Call':      { id: 'PANGGILAN AKHIR', en: 'FINAL CALL',  cls: 'bg-orange-400 text-black' },
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
            <div className="gate-board h-screen bg-black text-white font-sans select-none overflow-hidden flex flex-col">
                <header
                    className="gate-header relative w-full shrink-0 flex items-center justify-between bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 overflow-hidden shadow-lg border-b-2 border-black bg-cover bg-center"
                    style={{ backgroundImage: bgImage ? `url(${bgImage})` : undefined }}
                >
                    {!bgImage && <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>}
                    <div className="absolute inset-0 bg-black/80"></div>
                    {/* Kiri: judul + baris info (tanggal, cuaca). Kanan: jam besar,
                        karena jam adalah yang paling sering dicari penumpang. */}
                    <div className="gate-header-main relative z-10 min-w-0 flex-1">
                        <h1 className="gate-header-title">{t.boardingGates[lang]}</h1>
                        <div className="gate-header-meta">
                            <span className="shrink-0">{dateText}</span>
                            {weather && (
                                <>
                                    <span className="gate-header-dot" aria-hidden>•</span>
                                    <span className="shrink-0 tabular-nums">{weather.suhu}°C</span>
                                    <span className="gate-header-weather">{weather.kondisi_cuaca}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="gate-header-clock relative z-10 shrink-0 tabular-nums">
                        {timeText}
                    </div>
                </header>

                <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto scrollbar-hide relative bg-black">
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-yellow-500 font-bold text-[3.4vmin] animate-pulse tracking-widest">
                            {t.loading[lang]}
                        </div>
                    ) : (
                        <div className="gate-grid grid grid-cols-1 landscape:grid-cols-2">
                            {gates.map(gate => {
                                const visibleFlights = gate.flights ?? [];
                                // Backend sudah mengurutkan penghuni gate di posisi pertama
                                // (prioritas status, baru jam jadwal), jadi warna kartu cukup
                                // mengikuti elemen pertama.
                                const primaryFlight = visibleFlights[0] ?? null;

                                return (
                                    <div
                                        key={gate.id}
                                        className={`gate-card ${gate.status_gate !== 'aktif' ? 'gate-card-closed' : ''}`}
                                        data-status={primaryFlight?.status}
                                    >
                                        {/* Panel kiri — kode gate */}
                                        <div className="gate-code-panel w-[22%] shrink-0 bg-black flex flex-col items-center justify-center border-r border-black/50 p-[1.5vmin] gap-[0.5vmin]">
                                            <span className="text-[2.8vmin] text-white font-bold tracking-widest uppercase">{t.gate[lang]}</span>
                                            <span className={`gate-code text-[10vmin] font-black leading-none ${

                                                gate.status_gate === 'aktif' ? 'text-yellow-400' : 'text-gray-600'
                                            }`}>
                                                {/* Nama gate yang dikenal penumpang ("Gate A1"), bukan kode internal ("01"). */}
                                                {(gate.nama_gate || gate.kode_gate).replace(/^gate\s+/i, '')}
                                            </span>
                                            {gate.petunjuk_arah && (
                                                <CounterArrow
                                                    arah={gate.petunjuk_arah}
                                                    className="gate-direction h-[8vmin] w-[8vmin]"
                                                />
                                            )}
                                        </div>

                                        {/* Panel kanan — info penerbangan */}
                                        <div className="gate-flight flex-1 min-w-0 flex flex-col justify-center">
                                            {gate.status_gate !== 'aktif' ? (
                                                <div className="text-[4.5vmin] font-bold tracking-widest uppercase text-yellow-400 text-center">
                                                    {t.closed[lang]}
                                                </div>
                                            ) : visibleFlights.length === 0 ? (
                                                // Gate kosong. Bila masih ada jadwal berikutnya hari ini,
                                                // jamnya jauh lebih berguna bagi penumpang yang berdiri di
                                                // depan gate daripada sekadar kalimat menunggu.
                                                gate.upcoming_flight ? (
                                                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                                                        <span className="text-[2.8vmin] font-black tracking-[0.2em] uppercase text-white">
                                                            {t.nextFlight[lang]}
                                                        </span>
                                                        {gate.upcoming_flight.maskapai?.logo && (
                                                            <div className="bg-white rounded py-1 px-2 h-[6vmin] w-[18vmin] shrink-0 flex items-center justify-center">
                                                                <AirlineLogo src={gate.upcoming_flight.maskapai.logo} name={gate.upcoming_flight.maskapai.nama ?? 'Maskapai'} />
                                                            </div>
                                                        )}
                                                        <div className="flex items-baseline justify-center gap-4 flex-wrap">
                                                            <span className="text-[6.5vmin] font-black tracking-wide tabular-nums text-white">
                                                                {gate.upcoming_flight.jam_jadwal?.substring(0, 5) ?? '--:--'}
                                                            </span>
                                                            <span className="text-[5vmin] font-black tracking-wider text-white">
                                                                {gate.upcoming_flight.nomor_penerbangan}
                                                            </span>
                                                        </div>
                                                        <span className="text-[5vmin] font-bold truncate max-w-full text-yellow-200">
                                                            {gate.upcoming_flight.tujuan}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="text-[3.6vmin] font-bold tracking-wider uppercase text-white text-center">
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
                                                                <div className="flex justify-between items-center gap-[2vmin]">
                                                                    <div className="bg-white rounded py-1 px-3 h-[7vmin] w-[22vmin] shrink-0 max-w-full flex items-center justify-center shadow-inner">
                                                                        {fl.maskapai?.logo ? (
                                                                            <AirlineLogo src={fl.maskapai.logo} name={fl.maskapai.nama ?? 'Maskapai'} />
                                                                        ) : (
                                                                            <span className="font-bold text-gray-800 text-[2.6vmin]">{fl.maskapai?.nama}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="gate-flight-number text-[5vmin] font-black whitespace-nowrap">
                                                                        {fl.nomor_penerbangan}
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between items-baseline gap-[2vmin]">
                                                                    <div className={`gate-destination text-[6.5vmin] leading-tight font-bold min-w-0 ${
                                                                        isCO ? 'text-cyan-50' : 'text-yellow-300'
                                                                    }`}>
                                                                        {fl.tujuan}
                                                                    </div>
                                                                    <div className="gate-time text-[5vmin] font-black tabular-nums shrink-0">
                                                                        {fl.jam_jadwal?.substring(0, 5) ?? '--:--'}
                                                                    </div>
                                                                </div>
                                                                {OCCUPANT_BADGE[fl.status] && (
                                                                    <div className="mt-1">
                                                                        <span className={`gate-status inline-block px-[1.8vmin] py-[0.5vmin] rounded-full text-[3vmin] font-black tracking-widest uppercase ${OCCUPANT_BADGE[fl.status].cls}`}>
                                                                            {OCCUPANT_BADGE[fl.status][lang]}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {isCO && (
                                                                    <div className="checkin-badge flex flex-wrap items-center gap-[1.5vmin] mt-1 pt-2 border-t border-cyan-400/30">
                                                                        <span className="gate-status px-[1.8vmin] py-[0.5vmin] rounded-full bg-cyan-400 text-black text-[3vmin] font-black tracking-widest uppercase">
                                                                            {lang === 'id' ? 'CHECK-IN DIBUKA' : 'CHECK-IN OPEN'}
                                                                        </span>
                                                                        {fl.checkin_counter && (
                                                                            <span className="text-white text-[3vmin] font-bold tracking-wide">
                                                                                {lang === 'id' ? 'Menuju Counter' : 'Proceed to Counter'}{' '}
                                                                                <span className="text-white font-black text-[3vmin]">{fl.checkin_counter}</span>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {isDep && (
                                                                    <div className="mt-1">
                                                                        <span className="gate-status inline-block text-[3vmin] font-black tracking-widest uppercase text-gray-100 bg-gray-600/80 border border-gray-300/70 px-[1.8vmin] py-[0.5vmin] rounded">
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
                                                        <div className="gate-next mt-[1vmin] pt-[1vmin] border-t-2 border-white/40 flex flex-col gap-[0.8vmin]">
                                                            <span className="text-[2.8vmin] font-black tracking-[0.2em] uppercase text-white">
                                                                {t.nextUp[lang]}
                                                            </span>
                                                            {visibleFlights.slice(1).map(fl => {
                                                                const isCO = fl.status === 'Check-in Open';
                                                                const isDep = fl.status === 'Departed';
                                                                return (
                                                                    // Kolom tetap (jam | nomor | tujuan | status) supaya antrian
                                                                    // terbaca seperti tabel FIDS dan badge tidak pernah turun
                                                                    // baris lalu terlihat milik penerbangan di bawahnya. Logo
                                                                    // sengaja tidak ditampilkan di sini agar nama kota muat.
                                                                    <div
                                                                        key={fl.id}
                                                                        className={`gate-next-row ${isDep ? 'opacity-70' : ''}`}
                                                                    >
                                                                        <span className="tabular-nums">
                                                                            {fl.jam_jadwal?.substring(0, 5) ?? '--:--'}
                                                                        </span>
                                                                        <span className="font-black whitespace-nowrap">
                                                                            {fl.nomor_penerbangan}
                                                                        </span>
                                                                        <span className={`truncate min-w-0 ${
                                                                            isCO ? 'text-cyan-50' : isDep ? 'text-gray-200' : 'text-yellow-100'
                                                                        }`}>
                                                                            {fl.tujuan}
                                                                        </span>
                                                                        <span className="gate-next-status">
                                                                            {isCO && (
                                                                                <span className="bg-cyan-400 text-black">CHECK-IN</span>
                                                                            )}
                                                                            {OCCUPANT_BADGE[fl.status] && (
                                                                                <span className={OCCUPANT_BADGE[fl.status].cls}>
                                                                                    {OCCUPANT_BADGE[fl.status][lang]}
                                                                                </span>
                                                                            )}
                                                                            {isDep && (
                                                                                <span className="text-gray-100 bg-gray-600/80 border border-gray-300/70">
                                                                                    {lang === 'id' ? 'BERANGKAT' : 'DEPARTED'}
                                                                                </span>
                                                                            )}
                                                                        </span>
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

                <div id="gate-connection-status" />
                {tickerText && (
                    <footer className="h-[7vmin] shrink-0 bg-black border-t border-gray-800 flex items-center overflow-hidden">
                        <div className="bg-yellow-500 text-black font-black text-[3.4vmin] px-[2.5vmin] h-full flex items-center shrink-0 z-10 shadow-lg">
                            {t.info[lang]}
                        </div>
                        <div className="w-full relative h-full flex items-center">
                            <div style={{ animationDuration: tickerDuration(tickerSpeed) }} className="whitespace-nowrap absolute font-semibold text-white tracking-wider text-[3.4vmin] animate-[ticker_linear_infinite]">
                                {tickerText}
                            </div>
                        </div>
                    </footer>
                )}
            </div>
        </FidsLayout>
    );
}
