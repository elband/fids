import { useEffect, useState, useCallback } from 'react';
import FidsLayout from '@/Layouts/FidsLayout';
import { Clock, Sun, Thermometer } from 'lucide-react';
import { t, type Lang } from '@/lib/fids';
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
    flights?: Flight[];
}

interface WeatherInfo {
    suhu: string;
    kondisi_cuaca: string;
    lokasi: string;
}

export default function SingleBaggageDisplay({ identifier }: { identifier: string }) {
    const [belt, setBelt] = useState<BaggageClaim | null>(null);
    const [weather, setWeather] = useState<WeatherInfo | null>(null);
    const [bgImage, setBgImage] = useState<string | null>(null);
    const { time24h, dateFullId } = useNtpClock();
    const [error, setError] = useState<string | null>(null);
    const [lang, setLang] = useState<Lang>('id');

    const fetchData = useCallback(async () => {
        try {
            const [res, weatherRes, settingsRes] = await Promise.all([
                fetch(`/api/fids/baggage/${identifier}`),
                fetch('/api/fids/weather'),
                fetch('/api/fids/settings')
            ]);

            if (res.status === 404) {
                setError('Belt not found');
                return;
            }
            const json = await res.json();
            setBelt(json.data);
            setError(null);

            if (weatherRes.ok) {
                const weatherJson = await weatherRes.json();
                setWeather(weatherJson.data);
            }

            if (settingsRes.ok) {
                const settingsJson = await settingsRes.json();
                if (settingsJson.data?.background_header) setBgImage(settingsJson.data.background_header);
                if (settingsJson.data?.bahasa) setLang(settingsJson.data.bahasa);
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        }
    }, [identifier]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const flight = belt?.flights && belt?.flights.length > 0 ? belt.flights[0] : null;

    let bgColor = 'bg-black';
    let borderColor = 'border-gray-800';

    if (belt?.status_belt === 'aktif') {
        bgColor = flight?.airline?.warna ? `bg-[${flight.airline.warna}] bg-opacity-20` : 'bg-purple-900/40';
        borderColor = flight?.airline?.warna ? `border-[${flight.airline.warna}]` : 'border-purple-500';
    }

    if (error) {
        return (
            <FidsLayout title={`FIDS - Baggage Belt ${identifier}`}>
                <div className="h-screen bg-black flex items-center justify-center text-white text-4xl">
                    {error}
                </div>
            </FidsLayout>
        );
    }

    if (!belt) {
        return (
            <FidsLayout title={`FIDS - Baggage Belt ${identifier}`}>
                <div className="h-screen bg-black flex items-center justify-center text-yellow-500 text-4xl animate-pulse">
                    {t.loading[lang]}
                </div>
            </FidsLayout>
        );
    }

    const isClosed = belt?.status_belt !== 'aktif';

    return (
        <FidsLayout title={`FIDS - Baggage Belt ${identifier}`}>
            <div
                className={`h-screen text-white font-sans select-none overflow-hidden flex flex-col transition-all duration-1000 ${bgColor} relative`}
                style={bgImage ? {
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                } : {}}
            >
                <div className="absolute top-8 left-8 right-8 z-50 flex items-start justify-between pointer-events-none">
                    <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
                        <div className="p-3 bg-white/5 rounded-xl text-white/80">
                            <Clock size={32} strokeWidth={2} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-5xl font-black tracking-tighter text-white drop-shadow-md leading-none">
                                {time24h}
                            </span>
                            <span className="text-[0.7rem] font-bold text-white/60 uppercase tracking-[0.2em] mt-4">
                                {dateFullId}
                            </span>
                        </div>
                    </div>

                    {weather && (
                        <div className="flex items-center bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl divide-x divide-white/10 overflow-hidden pointer-events-auto">
                            <div className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors">
                                <div className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)] animate-pulse">
                                    <Sun size={40} fill="currentColor" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[0.6rem] font-black text-white/40 uppercase tracking-[0.2em]">{t.weatherLabel[lang]}</span>
                                    <span className="text-2xl font-bold text-white whitespace-nowrap leading-tight">
                                        {weather.kondisi_cuaca}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors">
                                <div className="text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]">
                                    <Thermometer size={40} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[0.6rem] font-black text-white/40 uppercase tracking-[0.2em]">{t.tempLabel[lang]}</span>
                                    <span className="text-3xl font-black text-white leading-tight">
                                        {weather.suhu}°C
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col p-12 mt-40">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <div className="text-3xl text-gray-400 tracking-[0.5em] font-medium uppercase mb-2">{t.baggageClaimBelt[lang]}</div>
                            <div className="text-[12rem] leading-none font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                {belt.nomor_belt}
                            </div>
                        </div>
                        {flight?.airline?.logo && (
                            <div className="bg-white p-6 rounded-3xl shadow-2xl">
                                <img src={flight.airline.logo} alt="Airline Logo" style={{ height: '20vw' }} className="object-contain" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                        {belt.status_belt !== 'aktif' ? (
                            <div className="text-[8rem] font-black text-gray-600 tracking-widest text-center mt-20">
                                {t.closed[lang]}
                            </div>
                        ) : (
                            <>
                                {flight ? (
                                    <div className="space-y-6">
                                        <div className="text-4xl text-yellow-400 tracking-widest font-bold">{t.flightLabel[lang]}</div>
                                        <div className="text-[7rem] leading-none font-bold text-white drop-shadow-md">
                                            {flight.nomor_penerbangan}
                                        </div>

                                        <div className="h-12"></div>

                                        <div className="text-4xl text-yellow-400 tracking-widest font-bold">{t.arrivingFromLabel[lang]}</div>
                                        <div className="text-[8rem] leading-none font-black text-white truncate drop-shadow-lg uppercase">
                                            {flight.asal}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-[6rem] font-bold text-gray-400 tracking-widest text-center mt-20 leading-tight whitespace-pre-line">
                                        {t.awaitingBaggageBig[lang]}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className={`mt-auto h-32 rounded-2xl flex items-center justify-center border-4 ${borderColor} ${belt.status_belt === 'aktif' && flight ? 'bg-white/10' : 'bg-transparent border-transparent'}`}>
                        {belt.status_belt === 'aktif' && flight && (
                            <div className="text-6xl font-black tracking-widest text-yellow-300 uppercase animate-pulse">
                                {t.collectLuggage[lang]}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </FidsLayout>
    );
}
