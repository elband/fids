import { useEffect, useState, useCallback } from 'react';
import FidsLayout from '@/Layouts/FidsLayout';
import { Clock, Sun, Thermometer } from 'lucide-react';
import { t, type Lang } from '@/lib/fids';
import { useNtpClock } from '@/hooks/useNtpClock';

interface Flight {
    id: number;
    jam_jadwal: string;
    nomor_penerbangan: string;
    tujuan: string;
    status: string;
    airline: {
        nama: string;
        logo: string | null;
        warna: string;
    };
}

interface CheckinCounter {
    id: number;
    nomor_counter: string;
    status_counter: string;
    flights?: Flight[];
}

interface WeatherInfo {
    suhu: string;
    kondisi_cuaca: string;
    lokasi: string;
}

export default function SingleCheckinDisplay({ identifier }: { identifier: string }) {
    const [counter, setCounter] = useState<CheckinCounter | null>(null);
    const [weather, setWeather] = useState<WeatherInfo | null>(null);
    const [bgImage, setBgImage] = useState<string | null>(null);
    const { time24h, dateFullId } = useNtpClock();
    const [error, setError] = useState<string | null>(null);
    const [lang, setLang] = useState<Lang>('id');

    const fetchData = useCallback(async () => {
        try {
            const [res, weatherRes, settingsRes] = await Promise.all([
                fetch(`/api/fids/checkin/${identifier}`),
                fetch('/api/fids/weather'),
                fetch('/api/fids/settings')
            ]);

            if (res.status === 404) {
                setError('Counter not found');
                return;
            }
            const json = await res.json();
            setCounter(json.data);
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

    const flight = counter?.flights && counter?.flights.length > 0 ? counter.flights[0] : null;

    let bgColor = 'bg-black';
    let borderColor = 'border-gray-800';

    if (counter?.status_counter === 'buka') {
        bgColor = flight?.airline?.warna ? `bg-[${flight.airline.warna}] bg-opacity-20` : 'bg-blue-900/40';
        borderColor = flight?.airline?.warna ? `border-[${flight.airline.warna}]` : 'border-blue-500';
    }

    if (error) {
        return (
            <FidsLayout title={`FIDS - Counter ${identifier}`}>
                <div className="h-screen bg-black flex items-center justify-center text-white text-4xl">
                    {error}
                </div>
            </FidsLayout>
        );
    }

    if (!counter) {
        return (
            <FidsLayout title={`FIDS - Counter ${identifier}`}>
                <div className="h-screen bg-black flex items-center justify-center text-yellow-500 text-4xl animate-pulse">
                    {t.loading[lang]}
                </div>
            </FidsLayout>
        );
    }

    const isClosed = counter?.status_counter !== 'buka';

    return (
        <FidsLayout title={`FIDS - Counter ${identifier}`}>
            <div
                className={`h-screen text-white font-sans select-none overflow-hidden flex flex-col transition-all duration-1000 ${bgColor} relative`}
                style={bgImage ? {
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                } : {}}
            >
                <div className="absolute top-[2vw] left-[2vw] right-[2vw] z-50 flex items-start justify-between pointer-events-none">
                    <div className="flex items-center gap-[1vw] bg-black/40 backdrop-blur-xl px-[2vw] py-[1vw] rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
                        <div className="p-[0.5vw] bg-white/5 rounded-xl text-white/80">
                            <Clock size={32} strokeWidth={2} />
                        </div>
                        <div className="flex flex-col">
                            <span style={{ fontSize: '3.5vw' }} className="font-black tracking-tighter text-white drop-shadow-md leading-none">
                                {time24h}
                            </span>
                            <span style={{ fontSize: '0.9vw' }} className="font-bold text-white/60 uppercase tracking-[0.2em] mt-1">
                                {dateFullId}
                            </span>
                        </div>
                    </div>

                    {weather && (
                        <div className="flex items-center bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl divide-x divide-white/10 overflow-hidden pointer-events-auto">
                            <div className="flex items-center gap-[1vw] px-[2vw] py-[1vw] hover:bg-white/5 transition-colors">
                                <div className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)] animate-pulse">
                                    <Sun size={32} fill="currentColor" />
                                </div>
                                <div className="flex flex-col">
                                    <span style={{ fontSize: '0.7vw' }} className="font-black text-white/40 uppercase tracking-[0.2em]">{t.weatherLabel[lang]}</span>
                                    <span style={{ fontSize: '1.5vw' }} className="font-bold text-white whitespace-nowrap leading-tight">
                                        {weather.kondisi_cuaca}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-[1vw] px-[2vw] py-[1vw] hover:bg-white/5 transition-colors">
                                <div className="text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]">
                                    <Thermometer size={32} />
                                </div>
                                <div className="flex flex-col">
                                    <span style={{ fontSize: '0.7vw' }} className="font-black text-white/40 uppercase tracking-[0.2em]">{t.tempLabel[lang]}</span>
                                    <span style={{ fontSize: '1.8vw' }} className="font-black text-white leading-tight">
                                        {weather.suhu}°C
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col p-[3vw] mt-[12vw]">
                    <div className="flex justify-between items-start mb-[2vh]">
                        <div>
                            <div style={{ fontSize: '1.8vw' }} className="text-gray-400 tracking-[0.5em] font-medium uppercase mb-2">{t.checkinCounterLabel[lang]}</div>
                            <div style={{ fontSize: '18vw', lineHeight: 1 }} className="font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                {counter.nomor_counter}
                            </div>
                        </div>
                        {flight?.airline?.logo && (
                            <div className="bg-white p-6 rounded-3xl shadow-2xl">
                                <img src={flight.airline.logo} alt="Airline Logo" style={{ height: '14vw' }} className="object-contain" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                        {counter.status_counter !== 'buka' ? (
                            <div style={{ fontSize: '10vw' }} className="font-black text-gray-600 tracking-widest text-center mt-[5vh]">
                                {t.closed[lang]}
                            </div>
                        ) : (
                            <>
                                {flight ? (
                                    <div className="space-y-[2vh]">
                                        <div style={{ fontSize: '2.5vw' }} className="text-yellow-400 tracking-widest font-bold">{t.flightLabel[lang]}</div>
                                        <div style={{ fontSize: '9vw', lineHeight: 1 }} className="font-bold text-white drop-shadow-md">
                                            {flight.nomor_penerbangan}
                                        </div>

                                        <div className="h-[3vh]"></div>

                                        <div style={{ fontSize: '2.5vw' }} className="text-yellow-400 tracking-widest font-bold">{t.destinationLabel[lang]}</div>
                                        <div style={{ fontSize: '10vw', lineHeight: 1 }} className="font-black text-white truncate drop-shadow-lg uppercase">
                                            {flight.tujuan}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '8vw' }} className="font-bold text-gray-400 tracking-widest text-center mt-[5vh] leading-tight whitespace-pre-line">
                                        {t.checkinOpen[lang]}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div style={{ height: '10vh' }} className={`mt-auto rounded-2xl flex items-center justify-center border-4 ${borderColor} ${counter.status_counter === 'buka' && flight ? 'bg-white/10' : 'bg-transparent border-transparent'}`}>
                        {counter.status_counter === 'buka' && flight && (
                            <div style={{ fontSize: '4vw' }} className="font-black tracking-widest text-yellow-300 uppercase animate-pulse">
                                {t.proceedToCounter[lang]} {counter.nomor_counter}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </FidsLayout>
    );
}
