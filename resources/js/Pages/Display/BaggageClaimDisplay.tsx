import { useEffect, useState, useCallback } from 'react';
import FidsLayout from '@/Layouts/FidsLayout';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { hexToRgba, t, type Lang } from '@/lib/fids';
import { useNtpClock } from '@/hooks/useNtpClock';

interface Flight {
    id: number;
    jam_jadwal: string;
    nomor_penerbangan: string;
    asal: string;
    status: string;
    airline: {
        nama: string;
        logo: string | null;
        warna: string;
    };
}

interface BaggageClaim {
    id: number;
    nomor_belt: string;
    status_belt: string;
    terminal: string;
    flights?: Flight[];
}

export default function BaggageClaimDisplay() {
    const [claims, setClaims] = useState<BaggageClaim[]>([]);
    const { dateText, timeText } = useNtpClock();
    const [loading, setLoading] = useState(true);
    const [scrollSpeed, setScrollSpeed] = useState(1);
    const scrollRef = useAutoScroll(scrollSpeed, 4000, [claims]);
    const [weather, setWeather] = useState<{ suhu: string; kondisi_cuaca: string } | null>(null);
    const [bgImage, setBgImage] = useState<string | null>(null);
    const [tickerText, setTickerText] = useState('');
    const [lang, setLang] = useState<Lang>('id');

    const fetchData = useCallback(async () => {
        try {
            const [resClaims, resSettings, resWeather] = await Promise.all([
                fetch('/api/fids/baggage-claims'),
                fetch('/api/fids/settings'),
                fetch('/api/fids/weather')
            ]);
            const jsonClaims = await resClaims.json();
            const jsonSettings = await resSettings.json();

            setClaims(jsonClaims.data || []);

            if (resWeather.ok) {
                const jsonWeather = await resWeather.json();
                setWeather(jsonWeather.data);
            }
            if (jsonSettings.data?.background_header) setBgImage(jsonSettings.data.background_header);
            if (jsonSettings.data?.kecepatan_scroll !== undefined) setScrollSpeed(jsonSettings.data.kecepatan_scroll);
            if (jsonSettings.data?.teks_ticker) setTickerText(jsonSettings.data.teks_ticker);
            if (jsonSettings.data?.bahasa) setLang(jsonSettings.data.bahasa);
        } catch (err) {
            console.error('Failed to fetch baggage claims:', err);
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
        <FidsLayout title="FIDS - Baggage Claim">
            <div className="h-screen bg-black text-white font-sans select-none overflow-hidden flex flex-col">
                <header
                    className="relative w-full h-24 flex items-center justify-between px-8 bg-gradient-to-r from-purple-900 via-fuchsia-900 to-slate-900 overflow-hidden shadow-lg border-b-2 border-black bg-cover bg-center"
                    style={{ backgroundImage: bgImage ? `url(${bgImage})` : undefined }}
                >
                    {!bgImage && <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>}
                    <div className="absolute inset-0 bg-black/30"></div>
                    <div className="relative z-10 w-1/3">
                        <h1 className="text-4xl font-extrabold tracking-tighter text-white drop-shadow-lg">
                            {t.baggageClaim[lang]}
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
                            {claims.map(claim => {
                                let bgColor = 'bg-gray-900 border-gray-800';

                                if (claim.status_belt === 'aktif') {
                                    bgColor = 'border-purple-900/50 shadow-lg shadow-purple-900/20';
                                }

                                const flight = claim.flights && claim.flights.length > 0 ? claim.flights[0] : null;
                                const rowColor = flight?.airline?.warna && claim.status_belt === 'aktif'
                                    ? hexToRgba(flight.airline.warna, 0.4)
                                    : (claim.status_belt === 'aktif' ? 'rgba(147, 51, 234, 0.2)' : '');

                                return (
                                    <div key={claim.id}
                                         className={`rounded-xl border-2 flex overflow-hidden transition-all duration-500 h-40 ${bgColor}`}
                                         style={{ backgroundColor: rowColor }}
                                    >
                                        <div className="w-1/4 bg-black flex flex-col items-center justify-center border-r border-black/50 p-4">
                                            <span className="text-sm text-gray-400 font-bold tracking-widest uppercase mb-1">{t.belt[lang]}</span>
                                            <span className={`text-6xl font-black ${claim.status_belt === 'aktif' ? 'text-yellow-400' : 'text-gray-600'}`}>
                                                {claim.nomor_belt}
                                            </span>
                                        </div>

                                        <div className="w-3/4 flex flex-col justify-center p-6 relative">
                                            {claim.status_belt !== 'aktif' ? (
                                                <div className="text-3xl font-bold tracking-widest uppercase text-gray-600 text-center opacity-50">
                                                    {t.closed[lang]}
                                                </div>
                                            ) : (
                                                <>
                                                    {flight ? (
                                                        <>
                                                            <div className="flex justify-between items-center mb-4">
                                                                <div className="bg-white rounded py-1 px-3 h-12 flex items-center shadow-inner max-w-[160px]">
                                                                    {flight.airline?.logo ? (
                                                                        <img src={flight.airline.logo} className="max-h-8 w-auto object-contain" alt="logo" />
                                                                    ) : (
                                                                        <span className="font-bold text-gray-800 text-sm">{flight.airline?.nama}</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-3xl font-black tracking-widest">
                                                                    {flight.nomor_penerbangan}
                                                                </div>
                                                            </div>

                                                            <div className="flex justify-between items-end">
                                                                <div className="text-4xl font-bold text-yellow-400 truncate pr-4 drop-shadow-md">
                                                                    {t.from[lang]}{flight.asal}
                                                                </div>
                                                                <div className="text-2xl font-bold tracking-wider">
                                                                    {flight.jam_jadwal?.substring(0, 5) ?? '--:--'}
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-2xl font-bold tracking-widest uppercase text-gray-400 text-center">
                                                            {t.awaitingBaggage[lang]}
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
