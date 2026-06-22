import { useEffect, useState, useCallback } from 'react';
import FidsLayout from '@/Layouts/FidsLayout';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { hexToRgba, t, type Lang } from '@/lib/fids';
import { useNtpClock } from '@/hooks/useNtpClock';

interface Flight {
    id: number;
    jam_jadwal: string;
    nomor_penerbangan: string;
    tujuan: string;
    status: string;
}

interface Airline {
    id: number;
    nama: string;
    logo: string | null;
    warna: string;
}

interface CheckinCounter {
    id: number;
    nomor_counter: string;
    status_counter: string;
    terminal: string;
    idle_image?: string | null;
    airline?: Airline;
    flights?: Flight[];
}

export default function CheckinCounterDisplay() {
    const [counters, setCounters] = useState<CheckinCounter[]>([]);
    const { dateText, timeText } = useNtpClock();
    const [loading, setLoading] = useState(true);
    const [scrollSpeed, setScrollSpeed] = useState(1);
    const scrollRef = useAutoScroll(scrollSpeed, 4000, [counters]);
    const [weather, setWeather] = useState<{ suhu: string; kondisi_cuaca: string } | null>(null);
    const [bgImage, setBgImage] = useState<string | null>(null);
    const [tickerText, setTickerText] = useState('');
    const [lang, setLang] = useState<Lang>('id');

    const fetchData = useCallback(async () => {
        try {
            const [resCounters, resSettings, resWeather] = await Promise.all([
                fetch('/api/fids/checkin-counters'),
                fetch('/api/fids/settings'),
                fetch('/api/fids/weather')
            ]);
            const jsonCounters = await resCounters.json();
            const jsonSettings = await resSettings.json();

            setCounters(jsonCounters.data || []);

            if (resWeather.ok) {
                const jsonWeather = await resWeather.json();
                setWeather(jsonWeather.data);
            }
            if (jsonSettings.data?.background_header) setBgImage(jsonSettings.data.background_header);
            if (jsonSettings.data?.kecepatan_scroll !== undefined) setScrollSpeed(jsonSettings.data.kecepatan_scroll);
            if (jsonSettings.data?.teks_ticker) setTickerText(jsonSettings.data.teks_ticker);
            if (jsonSettings.data?.bahasa) setLang(jsonSettings.data.bahasa);
        } catch (err) {
            console.error('Failed to fetch counters:', err);
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
        <FidsLayout title="FIDS - Check-in Counter">
            <div className="h-screen bg-black text-white font-sans select-none overflow-hidden flex flex-col">
                <header
                    className="relative w-full h-24 flex items-center justify-between px-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 overflow-hidden shadow-lg border-b-2 border-black bg-cover bg-center"
                    style={{ backgroundImage: bgImage ? `url(${bgImage})` : undefined }}
                >
                    {!bgImage && <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>}
                    <div className="absolute inset-0 bg-black/30"></div>
                    <div className="relative z-10 w-1/3">
                        <h1 className="text-4xl font-extrabold tracking-tighter text-white drop-shadow-lg">
                            {t.checkinCounters[lang]}
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
                            {counters.map(counter => {
                                let bgColor = 'bg-gray-900 border-gray-800';
                                let textColor = 'text-gray-500';

                                if (counter.status_counter === 'buka') {
                                    bgColor = 'border-blue-900/50 shadow-lg shadow-blue-900/20';
                                    textColor = 'text-white';
                                }

                                const rowColor = counter.airline?.warna && counter.status_counter === 'buka'
                                    ? hexToRgba(counter.airline.warna, 0.4)
                                    : (counter.status_counter === 'buka' ? 'rgba(30, 58, 138, 0.4)' : '');

                                return (
                                    <div key={counter.id}
                                         className={`rounded-xl border-2 flex overflow-hidden transition-all duration-500 h-40 ${bgColor}`}
                                         style={{ backgroundColor: rowColor }}
                                    >
                                        <div className="w-1/4 bg-black flex flex-col items-center justify-center border-r border-black/50 p-4">
                                            <span className="text-sm text-gray-400 font-bold tracking-widest uppercase mb-1">{t.counter[lang]}</span>
                                            <span className={`text-6xl font-black ${counter.status_counter === 'buka' ? 'text-yellow-400' : 'text-gray-600'}`}>
                                                {counter.nomor_counter}
                                            </span>
                                        </div>

                                        <div className="w-3/4 flex flex-col justify-center p-6 relative">
                                            {counter.status_counter === 'tutup' ? (
                                                counter.idle_image ? (
                                                    <img
                                                        src={counter.idle_image}
                                                        alt={`Counter ${counter.nomor_counter}`}
                                                        className="absolute inset-0 h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="text-3xl font-bold tracking-widest uppercase text-gray-600 text-center opacity-50">
                                                        {t.closed[lang]}
                                                    </div>
                                                )
                                            ) : (
                                                <>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="bg-white rounded py-1 px-3 h-12 flex items-center shadow-inner max-w-[160px]">
                                                            {counter.airline?.logo ? (
                                                                <img src={counter.airline.logo} className="max-h-8 w-auto object-contain" alt="logo" />
                                                            ) : (
                                                                <span className="font-bold text-gray-800 text-sm">{counter.airline?.nama || 'Common Use'}</span>
                                                            )}
                                                        </div>
                                                        {counter.flights && counter.flights.length > 0 && (
                                                            <div className="text-3xl font-black tracking-widest">
                                                                {counter.flights[0].nomor_penerbangan}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {counter.flights && counter.flights.length > 0 ? (
                                                        <div className="flex justify-between items-end">
                                                            <div className="text-4xl font-bold text-yellow-400 truncate pr-4 drop-shadow-md">
                                                                {counter.flights[0].tujuan}
                                                            </div>
                                                            <div className="text-2xl font-bold tracking-wider">
                                                                {counter.flights[0].jam_jadwal.substring(0, 5)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-2xl font-bold tracking-widest uppercase text-gray-300">
                                                            {t.openForCheckin[lang]}
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
