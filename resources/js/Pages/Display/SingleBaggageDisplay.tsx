import { useEffect, useState, useCallback } from 'react';
import FidsLayout from '@/Layouts/FidsLayout';
import { Clock, Sun, Thermometer } from 'lucide-react';
import { hexToRgba, t, type Lang } from '@/lib/fids';
import { useNtpClock } from '@/hooks/useNtpClock';

interface Flight {
    id: number;
    jam_jadwal: string;
    nomor_penerbangan: string;
    asal: string;
    status: string;
    arrived_at?: string | null;
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
    const { now, time24h, dateFullId } = useNtpClock();
    const [error, setError] = useState<string | null>(null);
    const [lang, setLang] = useState<Lang>('id');
    // Timing baggage claim (menit) dari Pengaturan Layar FIDS.
    const [durStatusMin, setDurStatusMin] = useState(30);

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
                setWeather((await weatherRes.json()).data);
            }

            if (settingsRes.ok) {
                const s = (await settingsRes.json()).data;
                if (s?.background_header) setBgImage(s.background_header);
                if (s?.bahasa) setLang(s.bahasa);
                if (typeof s?.bagasi_durasi_status_menit === 'number') setDurStatusMin(s.bagasi_durasi_status_menit);
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

    const flight = belt?.flights && belt.flights.length > 0 ? belt.flights[0] : null;

    // Menit sejak pesawat tiba (arrived_at dari server, dihitung dgn jam NTP).
    const elapsedMin = flight?.arrived_at
        ? (now.getTime() - new Date(flight.arrived_at).getTime()) / 60000
        : 0;

    // Belt yang di-set tidak_aktif/maintenance di modul Baggage Claim tidak boleh
    // menampilkan apa pun selain "TUTUP" — sama seperti layar gate & counter tunggal,
    // dan sama seperti papan bagasi grid. Sebelumnya layar ini mengabaikan status_belt
    // sehingga belt nonaktif tetap memajang penerbangan dan streaming CCTV-nya.
    const isBeltActive = belt?.status_belt === 'aktif';

    // Aturan: teks status tampil s/d durasi status; kamera tampil antara
    // menit "kamera muncul" s/d "kamera hilang".
    const showText = isBeltActive && !!flight && (!flight.arrived_at || elapsedMin < durStatusMin);

    const airlineColor = showText ? (flight?.airline?.warna ?? null) : null;

    if (error) {
        return (
            <FidsLayout title={`FIDS - Baggage Belt ${identifier}`}>
                <div className="h-screen bg-black flex items-center justify-center text-white text-4xl">{error}</div>
            </FidsLayout>
        );
    }

    if (!belt) {
        return (
            <FidsLayout title={`FIDS - Baggage Belt ${identifier}`}>
                <div className="h-screen bg-black flex items-center justify-center text-yellow-500 text-4xl animate-pulse">{t.loading[lang]}</div>
            </FidsLayout>
        );
    }

    const bgStyle: React.CSSProperties = bgImage
        ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : (airlineColor ? { backgroundColor: hexToRgba(airlineColor, 0.2) } : {});

    return (
        <FidsLayout title={`FIDS - Baggage Belt ${identifier}`}>
            <div className="h-screen text-white font-sans select-none overflow-hidden relative bg-black">
                {/* Latar layar bagasi. CCTV sengaja tidak ditampilkan di sini:
                    layar CCTV adalah halaman tersendiri (/public/cctv/baggage). */}
                <div className="absolute inset-0 z-0" style={bgStyle} />

                <div className="relative z-10 h-full flex flex-col">
                    {/* Header */}
                    <div className="relative z-50 shrink-0 mx-8 mt-8 flex items-start justify-between pointer-events-none">
                        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
                            <div className="p-3 bg-white/5 rounded-xl text-[#FFD700]"><Clock size={32} strokeWidth={2} /></div>
                            <div className="flex flex-col">
                                <span className="text-5xl font-black tracking-tighter text-[#FFD700] drop-shadow-md leading-none">{time24h}</span>
                                <span className="text-[0.7rem] font-bold text-[#FFD700]/70 uppercase tracking-[0.2em] mt-4">{dateFullId}</span>
                            </div>
                        </div>

                        {weather && (
                            <div className="flex items-center bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl divide-x divide-white/10 overflow-hidden pointer-events-auto">
                                <div className="flex items-center gap-4 px-6 py-4">
                                    <div className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)] animate-pulse"><Sun size={40} fill="currentColor" /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[0.6rem] font-black text-white/40 uppercase tracking-[0.2em]">{t.weatherLabel[lang]}</span>
                                        <span className="text-2xl font-bold text-white whitespace-nowrap leading-tight">{weather.kondisi_cuaca}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 px-6 py-4">
                                    <div className="text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]"><Thermometer size={40} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[0.6rem] font-black text-white/40 uppercase tracking-[0.2em]">{t.tempLabel[lang]}</span>
                                        <span className="text-3xl font-black text-white leading-tight">{weather.suhu}°C</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main */}
                    <div className="flex-1 flex flex-col p-[2vw] min-h-0">
                        <div className="flex justify-between items-start gap-[2vw] mb-[2vh]">
                            <div className="min-w-0">
                                <div style={{ fontSize: 'min(1.8vw, 2.4vh)' }} className="text-gray-300 tracking-[0.5em] font-medium uppercase mb-2 drop-shadow">{t.baggageClaimBelt[lang]}</div>
                                <div style={{ fontSize: 'min(16vw, 19vh)', lineHeight: 1 }} className="font-black text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]">
                                    {belt.nomor_belt}
                                </div>
                            </div>
                            {showText && flight?.airline?.logo && (
                                <div className="bg-white p-[1vw] rounded-3xl shadow-2xl shrink-0">
                                    <img src={flight.airline.logo} alt="Airline Logo" style={{ height: 'min(14vw, 20vh)', maxWidth: '32vw' }} className="object-contain" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 flex flex-col justify-center min-h-0">
                            {showText && flight ? (
                                <div className="space-y-[1.5vh]">
                                    <div style={{ fontSize: 'min(2.5vw, 3.2vh)' }} className="text-yellow-400 tracking-widest font-bold">{t.flightLabel[lang]}</div>
                                    <div style={{ fontSize: 'min(9vw, 12vh)', lineHeight: 1 }} className="font-bold text-[#FFD700] drop-shadow-md">
                                        {flight.nomor_penerbangan}
                                    </div>
                                    <div className="h-[2vh]"></div>
                                    <div style={{ fontSize: 'min(2.5vw, 3.2vh)' }} className="text-yellow-400 tracking-widest font-bold">{t.arrivingFromLabel[lang]}</div>
                                    <div style={{ fontSize: 'min(10vw, 14vh)', lineHeight: 1 }} className="font-black text-[#FFD700] truncate drop-shadow-lg uppercase">
                                        {flight.asal}
                                    </div>
                                </div>
                            ) : !isBeltActive ? (
                                <div style={{ fontSize: 'min(10vw, 14vh)' }} className="font-black text-yellow-400 tracking-widest text-center">
                                    {t.closed[lang]}
                                </div>
                            ) : (
                                <div style={{ fontSize: 'min(8vw, 11vh)' }} className="font-bold text-yellow-400 tracking-widest text-center leading-tight whitespace-pre-line drop-shadow-lg">
                                    {t.awaitingBaggageBig[lang]}
                                </div>
                            )}
                        </div>

                        {showText && flight && (
                            <div style={{ height: '10vh', ...(airlineColor ? { borderColor: airlineColor } : {}) }} className={`mt-auto shrink-0 rounded-2xl flex items-center justify-center border-4 ${airlineColor ? '' : 'border-purple-500'} bg-white/10`}>
                                <div style={{ fontSize: 'min(4vw, 5.5vh)' }} className="font-black tracking-widest text-yellow-300 uppercase animate-pulse">
                                    {t.collectLuggage[lang]}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </FidsLayout>
    );
}
