import { useEffect, useState, useCallback } from 'react';
import FidsLayout from '@/Layouts/FidsLayout';
import { Clock, Sun, Thermometer } from 'lucide-react';
import { hexToRgba, t, type Lang } from '@/lib/fids';
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

interface Gate {
    id: number;
    kode_gate: string;
    status_gate: string;
    flights?: Flight[];
}

interface WeatherInfo {
    suhu: string;
    kondisi_cuaca: string;
    lokasi: string;
}

export default function SingleGateDisplay({ identifier }: { identifier: string }) {
    const [gate, setGate] = useState<Gate | null>(null);
    const [weather, setWeather] = useState<WeatherInfo | null>(null);
    const [bgImage, setBgImage] = useState<string | null>(null);
    const { time24h, dateFullId } = useNtpClock();
    const [error, setError] = useState<string | null>(null);
    const [lang, setLang] = useState<Lang>('id');

    const fetchData = useCallback(async () => {
        try {
            const [res, weatherRes, settingsRes] = await Promise.all([
                fetch(`/api/fids/gate/${identifier}`),
                fetch('/api/fids/weather'),
                fetch('/api/fids/settings')
            ]);

            if (res.status === 404) {
                setError('Gate not found');
                return;
            }
            const json = await res.json();
            setGate(json.data);
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

    const flight = gate?.flights && gate?.flights.length > 0 ? gate.flights[0] : null;

    // Warna maskapai adalah nilai runtime → kelas Tailwind dinamis (bg-[#..]) tidak
    // pernah di-generate JIT saat build. Terapkan via inline style; kelas hanya fallback.
    const airlineColor = gate?.status_gate === 'aktif' ? (flight?.airline?.warna ?? null) : null;
    let bgColor = 'bg-black';
    let borderColor = 'border-gray-800';

    if (gate?.status_gate === 'aktif') {
        bgColor = airlineColor ? '' : 'bg-teal-900/40';
        borderColor = airlineColor ? '' : 'border-teal-500';
    }

    if (error) {
        return (
            <FidsLayout title={`FIDS - Gate ${identifier}`}>
                <div className="h-screen bg-black flex items-center justify-center text-white text-4xl">
                    {error}
                </div>
            </FidsLayout>
        );
    }

    if (!gate) {
        return (
            <FidsLayout title={`FIDS - Gate ${identifier}`}>
                <div className="h-screen bg-black flex items-center justify-center text-yellow-500 text-4xl animate-pulse">
                    {t.loading[lang]}
                </div>
            </FidsLayout>
        );
    }

    const isClosed = gate?.status_gate !== 'aktif';

    return (
        <FidsLayout title={`FIDS - Gate ${identifier}`}>
            <div
                className={`h-screen text-white font-sans select-none overflow-hidden flex flex-col transition-all duration-1000 ${bgColor} relative`}
                style={bgImage ? {
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                } : (airlineColor ? { backgroundColor: hexToRgba(airlineColor, 0.2) } : {})}
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

                <div className="flex-1 flex flex-col p-[2vw] mt-[13vh] min-h-0">
                    <div className="flex justify-between items-start gap-[2vw] mb-[2vh]">
                        <div className="min-w-0">
                            <div style={{ fontSize: 'min(1.8vw, 2.4vh)' }} className="text-gray-400 tracking-[0.5em] font-medium uppercase mb-2">{t.boardingGateLabel[lang]}</div>
                            <div style={{ fontSize: 'min(16vw, 19vh)', lineHeight: 1 }} className="font-black text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]">
                                {gate.kode_gate}
                            </div>
                        </div>
                        {flight?.airline?.logo && (
                            <div className="bg-white p-[1vw] rounded-3xl shadow-2xl shrink-0">
                                <img src={flight.airline.logo} alt="Airline Logo" style={{ height: 'min(14vw, 20vh)' }} className="object-contain" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col justify-center min-h-0">
                        {gate.status_gate !== 'aktif' ? (
                            <div style={{ fontSize: 'min(10vw, 14vh)' }} className="font-black text-gray-600 tracking-widest text-center">
                                {t.closed[lang]}
                            </div>
                        ) : (
                            <>
                                {flight ? (
                                    <div className="space-y-[1.5vh]">
                                        <div style={{ fontSize: 'min(2.5vw, 3.2vh)' }} className="text-yellow-400 tracking-widest font-bold">{t.flightLabel[lang]}</div>
                                        <div style={{ fontSize: 'min(9vw, 12vh)', lineHeight: 1 }} className="font-bold text-[#FFD700] drop-shadow-md">
                                            {flight.nomor_penerbangan}
                                        </div>

                                        <div className="h-[2vh]"></div>

                                        <div style={{ fontSize: 'min(2.5vw, 3.2vh)' }} className="text-yellow-400 tracking-widest font-bold">{t.destinationLabel[lang]}</div>
                                        <div style={{ fontSize: 'min(10vw, 14vh)', lineHeight: 1 }} className="font-black text-[#FFD700] truncate drop-shadow-lg uppercase">
                                            {flight.tujuan}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ fontSize: 'min(8vw, 11vh)' }} className="font-bold text-gray-400 tracking-widest text-center leading-tight whitespace-pre-line">
                                        {t.pleaseWait[lang]}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div style={{ height: '10vh', ...(airlineColor ? { borderColor: airlineColor } : {}) }} className={`mt-auto shrink-0 rounded-2xl flex items-center justify-center border-4 ${borderColor} ${gate.status_gate === 'aktif' && flight ? 'bg-white/10' : 'bg-transparent border-transparent'}`}>
                        {gate.status_gate === 'aktif' && flight && (
                            <div style={{ fontSize: 'min(4vw, 5.5vh)' }} className="font-black tracking-widest text-yellow-300 uppercase animate-pulse">
                                {flight.status === 'Boarding' || flight.status === 'Final Call' || flight.status === 'Gate Open'
                                    ? flight.status
                                    : t.boardingSoon[lang]}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </FidsLayout>
    );
}
