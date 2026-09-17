import { useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import '@/../css/amc-clock.css';
import FidsLayout from '@/Layouts/FidsLayout';
import { useNtpClock } from '@/hooks/useNtpClock';
import { getNtpStatus } from '@/lib/timezoneClock';
import { type Lang } from '@/lib/fids';
import {
    compassLabel, compassPoint, dataFreshness, describeMetarClouds, describeMetarWeather,
    formatMetarVisibility, formatVisibility, kmhToKnots, KMH_PER_KNOT,
    minutesSince, normalizeDegrees, visibilityLevel, windComponents,
} from '@/lib/amcWeather';
import {
    AlertTriangle, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSun, Sun, Wind, Eye, Thermometer,
} from 'lucide-react';

interface Weather {
    lokasi: string | null;
    suhu: number | null;
    kondisi_cuaca: string | null;
    kelembapan: number | null;
    kecepatan_angin: number | null;
    arah_angin: string | null;
    arah_angin_derajat: number | null;
    jarak_pandang: number | null;
    jarak_pandang_teks: string | null;
    tutupan_awan: number | null;
    berlaku_pada: string | null;
    last_updated: string | null;
}

interface MetarData {
    raw_text: string;
    observed_at: string | null;
    wind_dir_deg: number | null;
    wind_variable: boolean;
    wind_var_from: number | null;
    wind_var_to: number | null;
    wind_speed_kt: number | null;
    wind_gust_kt: number | null;
    visibility_m: number | null;
    present_weather: string | null;
    clouds: string | null;
    temperature_c: number | null;
    dew_point_c: number | null;
    qnh_hpa: number | null;
    trend: string | null;
}

interface MetarPayload {
    enabled: boolean;
    icao: string | null;
    source?: string;
    report: MetarData | null;
    problem: { code: string; message: string } | null;
}

/** METAR lebih tua dari ini tidak dipakai lagi; layar kembali ke prakiraan BMKG. */
const METAR_MAX_AGE_MINUTES = 180;

interface Settings {
    nama_bandara: string | null;
    runway_kode: string | null;
    runway_heading: number | null;
    bahasa: Lang;
}

const L = {
    title:      { id: 'AMC MASTER CLOCK',    en: 'AMC MASTER CLOCK' },
    wind:       { id: 'ANGIN',               en: 'WIND' },
    visibility: { id: 'JARAK PANDANG',       en: 'VISIBILITY' },
    weather:    { id: 'CUACA',               en: 'WEATHER' },
    humidity:   { id: 'KELEMBAPAN',          en: 'HUMIDITY' },
    clouds:     { id: 'TUTUPAN AWAN',        en: 'CLOUD COVER' },
    headwind:   { id: 'HEAD',                en: 'HEAD' },
    tailwind:   { id: 'TAIL',                en: 'TAIL' },
    crosswind:  { id: 'XWIND',               en: 'XWIND' },
    noData:     { id: 'DATA TIDAK TERSEDIA', en: 'NO DATA' },
    validAt:    { id: 'berlaku',             en: 'valid' },
    updated:    { id: 'diperbarui',          en: 'updated' },
    minutesAgo: { id: 'menit lalu',          en: 'min ago' },
    never:      { id: 'belum pernah',        en: 'never' },
    source:     { id: 'Prakiraan BMKG',      en: 'BMKG forecast' },
    dataSource: { id: 'SUMBER DATA',         en: 'DATA SOURCE' },
    sourceMetar: {
        id: 'BMKG · Portal Aviasi (METAR/SPECI)',
        en: 'BMKG · Aviation Portal (METAR/SPECI)',
    },
    sourceForecast: {
        id: 'BMKG · Prakiraan Cuaca Publik',
        en: 'BMKG · Public Weather Forecast',
    },
    qnh:        { id: 'QNH',                 en: 'QNH' },
    dewPoint:   { id: 'TITIK EMBUN',         en: 'DEW POINT' },
    observed:   { id: 'pengamatan',          en: 'observed' },
    metarWarning: {
        id: 'METAR HASIL SCRAPING BMKG - BUKAN SUMBER RESMI OPERASIONAL',
        en: 'METAR SCRAPED FROM BMKG - NOT AN OFFICIAL OPERATIONAL SOURCE',
    },
    metarFallback: {
        id: 'Layar menampilkan prakiraan BMKG sebagai pengganti.',
        en: 'Showing BMKG forecast instead.',
    },
    metarLastKnown: {
        id: 'Layar menampilkan METAR terakhir yang berhasil ditarik.',
        en: 'Showing the last METAR that was fetched successfully.',
    },
    warning:    {
        id: 'PRAKIRAAN BMKG - BUKAN DATA OPERASIONAL',
        en: 'BMKG FORECAST - NOT FOR OPERATIONAL USE',
    },
    ntpOk:      { id: 'WAKTU TERSINKRON',    en: 'TIME SYNCED' },
    ntpOff:     { id: 'SINKRON TERTUNDA',    en: 'SYNC PENDING' },
    localTime:  { id: 'WAKTU LOKAL',         en: 'LOCAL TIME' },
};

/**
 * Ikon lokal, bukan SVG dari api-apps.bmkg.go.id: kios AMC bisa saja hanya
 * diizinkan menjangkau server FIDS, dan ikon eksternal akan jadi kotak kosong.
 */
function WeatherIcon({ desc, className }: { desc: string | null; className?: string }) {
    const d = (desc ?? '').toLowerCase();
    const props = { className, strokeWidth: 1.5 };
    if (d.includes('petir') || d.includes('thunder')) return <CloudLightning {...props} />;
    if (d.includes('lebat') || d.includes('heavy rain')) return <CloudRain {...props} />;
    if (d.includes('hujan') || d.includes('rain')) return <CloudDrizzle {...props} />;
    if (d.includes('kabut') || d.includes('asap') || d.includes('fog') || d.includes('haze') || d.includes('mist') || d.includes('smoke') || d.includes('obscured')) return <CloudFog {...props} />;
    if (d.includes('berawan tebal') || d.includes('overcast') || d.includes('mendung') || d.includes('broken')) return <Cloud {...props} />;
    if (d.includes('berawan') || d.includes('cloud')) return <CloudSun {...props} />;
    return <Sun {...props} />;
}

/** Mawar angin: panah menunjuk ke arah DATANG angin, sesuai konvensi penerbangan. */
function WindRose({ deg, runwayHeading, color }: { deg: number | null; runwayHeading: number | null; color: string }) {
    const size = 'min(12vw,23vh)';
    return (
        <div className="amc-compass relative shrink-0" style={{ width: size, height: size }}>
            <svg className="amc-compass-ticks absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
                {Array.from({ length: 36 }, (_, i) => (
                    <line key={i} x1="50" y1="2" x2="50" y2={i % 3 === 0 ? '7' : '4.5'}
                        transform={`rotate(${i * 10} 50 50)`} stroke="currentColor" strokeWidth={i % 3 === 0 ? '1' : '0.5'} />
                ))}
                <circle cx="50" cy="50" r="2" fill="currentColor" />
            </svg>
            <div className="absolute inset-0 rounded-full border border-white/15" />
            <div className="absolute inset-[14%] rounded-full border border-white/10" />

            {/* Runway digambar sebagai garis melintang supaya hubungan angin-runway
                terbaca sebagai gambar, bukan hanya sebagai angka. */}
            {runwayHeading !== null && (
                <div className="absolute inset-0 flex items-center justify-center"
                     style={{ transform: `rotate(${normalizeDegrees(runwayHeading)}deg)` }}>
                    <div className="rounded-full bg-white/25" style={{ width: '8%', height: '84%' }} />
                </div>
            )}

            {/* Ditempatkan langsung per sisi, bukan lewat rotate+translate: label yang
                diputar keluar dari lingkaran dan menimpa teks kecepatan di sebelahnya. */}
            {([
                ['N', 'left-1/2 top-[3%] -translate-x-1/2'],
                ['E', 'right-[5%] top-1/2 -translate-y-1/2'],
                ['S', 'left-1/2 bottom-[3%] -translate-x-1/2'],
                ['W', 'left-[5%] top-1/2 -translate-y-1/2'],
            ] as const).map(([p, pos]) => (
                <span key={p}
                      style={{ fontSize: 'min(0.8vw,1.4vh)' }}
                      className={`absolute ${pos} font-black tracking-widest text-white/45`}>
                    {p}
                </span>
            ))}

            {deg !== null && (
                <div className="absolute inset-0 transition-transform duration-1000 ease-out"
                     style={{ transform: `rotate(${normalizeDegrees(deg)}deg)` }}>
                    {/* Ekor panah mulai dari tepi arah datang, kepalanya menunjuk ke pusat. */}
                    <div className="absolute left-1/2 -translate-x-1/2 rounded-full"
                         style={{ top: '16%', height: '38%', width: '5%', background: color }} />
                    <div className="absolute left-1/2 -translate-x-1/2"
                         style={{
                             top: '46%',
                             borderLeft: 'min(0.8vw,1.4vh) solid transparent',
                             borderRight: 'min(0.8vw,1.4vh) solid transparent',
                             borderTop: `min(1.5vw,2.5vh) solid ${color}`,
                         }} />
                </div>
            )}
        </div>
    );
}

function Card({ label, icon, accent, children }: {
    label: string; icon: ReactNode; accent: string; children: ReactNode;
}) {
    return (
        <section className="amc-card flex flex-col min-h-0 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40 px-[1.3vw] py-[1.2vh] backdrop-blur-xl">
            <div className="amc-card-heading flex shrink-0 items-center gap-[0.6vw]" style={{ color: accent }}>
                {icon}
                <span style={{ fontSize: 'min(1vw,1.7vh)' }} className="font-black uppercase tracking-[0.3em]">
                    {label}
                </span>
            </div>
            <div className="amc-card-body flex min-h-0 flex-1 flex-col justify-center overflow-hidden">
                {children}
            </div>
        </section>
    );
}

export default function AmcClockDisplay() {
    const { now, timezone, time24h, dateFullId } = useNtpClock();
    const [weather, setWeather] = useState<Weather | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [metar, setMetar] = useState<MetarPayload | null>(null);
    const [ntpSynced, setNtpSynced] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [wRes, sRes, mRes] = await Promise.all([
                fetch('/api/fids/weather'),
                fetch('/api/fids/settings'),
                fetch('/api/fids/metar'),
            ]);
            if (wRes.ok) setWeather((await wRes.json()).data);
            if (sRes.ok) setSettings((await sRes.json()).data);
            if (mRes.ok) {
                setMetar((await mRes.json()).data);
            } else {
                setMetar({
                    enabled: true, icao: null, report: null,
                    problem: { code: 'api', message: `Server FIDS gagal menyajikan data METAR (HTTP ${mRes.status}).` },
                });
            }
        } catch (err) {
            console.error('AMC clock: gagal mengambil data', err);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Slot prakiraan berganti tiap 3 jam dan fetch di server tiap 30 menit;
        // polling 1 menit sudah jauh lebih rapat daripada laju perubahan datanya.
        const id = setInterval(fetchData, 60_000);
        return () => clearInterval(id);
    }, [fetchData]);

    useEffect(() => {
        setNtpSynced(getNtpStatus() === 'synced');
        const id = setInterval(() => setNtpSynced(getNtpStatus() === 'synced'), 5000);
        return () => clearInterval(id);
    }, []);

    const lang: Lang = settings?.bahasa ?? 'id';
    const accent = '#38bdf8';

    const zoneClocks = useMemo(() => [
        { label: 'WIB', zone: 'Asia/Jakarta', offset: 'UTC+07', city: 'Jakarta' },
        { label: 'WIT', zone: 'Asia/Jayapura', offset: 'UTC+09', city: 'Jayapura' },
        { label: 'UTC', zone: 'UTC', offset: 'UTC+00', city: lang === 'id' ? 'Waktu universal' : 'Universal time' },
    ].map(clock => ({
        ...clock,
        time: new Intl.DateTimeFormat('en-GB', {
            timeZone: clock.zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
        }).format(now),
        date: new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', {
            timeZone: clock.zone, day: '2-digit', month: 'short', year: 'numeric',
        }).format(now),
    })), [now, lang]);
    const localZoneLabel = ({ 'Asia/Makassar': 'WITA', 'Asia/Jakarta': 'WIB', 'Asia/Jayapura': 'WIT' } as Record<string, string>)[timezone] ?? timezone;

    // METAR (pengamatan bandara) diutamakan; prakiraan BMKG hanya cadangan bila
    // METAR nonaktif, belum ada, atau sudah terlalu tua untuk dipajang.
    const metarAge = minutesSince(metar?.report?.observed_at, now);
    const obs = metar?.enabled && metar.report && metarAge !== null && metarAge <= METAR_MAX_AGE_MINUTES
        ? metar.report : null;

    const windKt = obs ? obs.wind_speed_kt
        : (weather?.kecepatan_angin != null ? kmhToKnots(weather.kecepatan_angin) : null);
    const windKmh = obs ? (obs.wind_speed_kt !== null ? obs.wind_speed_kt * KMH_PER_KNOT : null)
        : (weather?.kecepatan_angin ?? null);
    const windDeg = obs ? obs.wind_dir_deg : (weather?.arah_angin_derajat ?? null);
    const runwayHeading = settings?.runway_heading ?? null;

    const comp = useMemo(() => {
        if (windDeg === null || windKt === null || runwayHeading === null) return null;
        return windComponents(windDeg, windKt, runwayHeading);
    }, [windDeg, windKt, runwayHeading]);

    const vis = obs ? obs.visibility_m : (weather?.jarak_pandang ?? null);
    const visText = obs
        ? (obs.visibility_m !== null ? formatMetarVisibility(obs.visibility_m, lang) : null)
        : (weather?.jarak_pandang_teks?.trim() || null);
    const visLevel = vis !== null ? visibilityLevel(vis) : null;
    const visColor = visLevel === 'poor' ? '#f87171' : visLevel === 'moderate' ? '#fbbf24' : '#4ade80';

    const metarProblem = metar?.enabled ? metar.problem : null;
    const obsTime = obs?.observed_at
        ? new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(obs.observed_at))
        : null;

    const ageMin = obs ? metarAge : minutesSince(weather?.last_updated, now);
    const fresh = ageMin !== null ? dataFreshness(ageMin) : 'expired';
    const freshColor = fresh === 'expired' ? '#f87171' : fresh === 'stale' ? '#fbbf24' : '#94a3b8';

    const validText = useMemo(() => {
        if (!weather?.berlaku_pada) return null;
        const d = new Date(weather.berlaku_pada);
        if (Number.isNaN(d.getTime())) return null;
        return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', {
            timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false,
        }).format(d);
    }, [weather?.berlaku_pada, timezone, lang]);

    const dash = <span className="text-white/25">-</span>;
    const iconSize = { width: 'min(1.3vw,2.2vh)', height: 'min(1.3vw,2.2vh)' };

    return (
        <FidsLayout title="FIDS - AMC Master Clock">
            <div className="amc-display flex h-screen w-screen select-none flex-col overflow-hidden bg-[#050b16] font-sans text-white">

                <header className="amc-header flex shrink-0 items-center justify-between px-[2vw] pb-[0.8vh] pt-[1.4vh]">
                    <div className="amc-brand flex min-w-0 items-baseline gap-[1vw]">
                        <h1 style={{ fontSize: 'min(1.7vw,2.8vh)' }} className="truncate font-black tracking-[0.2em]">
                            {settings?.nama_bandara ?? 'FIDS'}
                        </h1>
                        <span style={{ fontSize: 'min(1vw,1.7vh)', color: accent }}
                              className="shrink-0 font-bold tracking-[0.35em]">
                            {L.title[lang]}
                        </span>
                    </div>

                    <div className={`flex shrink-0 items-center gap-[0.5vw] rounded-full border px-[1vw] py-[0.4vh] ${
                        ntpSynced ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-amber-400/40 bg-amber-500/10'}`}>
                        <span className={`rounded-full ${ntpSynced ? 'bg-emerald-400' : 'bg-amber-400'}`}
                              style={{ width: 'min(0.5vw,0.9vh)', height: 'min(0.5vw,0.9vh)' }} />
                        <span style={{ fontSize: 'min(0.7vw,1.2vh)' }}
                              className={`font-bold tracking-[0.2em] ${ntpSynced ? 'text-emerald-300' : 'text-amber-300'}`}>
                            {ntpSynced ? L.ntpOk[lang] : L.ntpOff[lang]}
                        </span>
                    </div>
                </header>

                {/* Jam: lokal sebagai tokoh utama, UTC sebagai pendamping. */}
                <div className="amc-hero flex shrink-0 items-center gap-[2vw] px-[2vw]" style={{ height: '40vh' }}>
                    <div className="min-w-0 flex-1">
                        <div style={{ fontSize: 'min(1vw,1.7vh)' }} className="font-bold uppercase tracking-[0.4em] text-white/40">
                            {L.localTime[lang]} <span className="amc-timezone">{localZoneLabel}</span>
                        </div>
                        <div style={{ fontSize: 'min(16vw,24vh)', lineHeight: 0.95 }}
                             className="amc-local-digits font-black tabular-nums tracking-tighter drop-shadow-[0_0_25px_rgba(56,189,248,0.25)]">
                            {time24h}
                        </div>
                        <div style={{ fontSize: 'min(1.5vw,2.4vh)' }} className="font-bold uppercase tracking-[0.15em] text-white/70">
                            {dateFullId}
                        </div>
                    </div>

                    <aside className="amc-zone-list" aria-label={lang === 'id' ? 'Zona waktu lainnya' : 'Other time zones'}>
                        {zoneClocks.map(clock => (
                            <section key={clock.label} className={`amc-zone-card amc-zone-${clock.label.toLowerCase()}`} aria-label={`${clock.label} ${clock.city}`}>
                                <div className="amc-zone-info">
                                    <div className="amc-zone-title">{clock.label}<span>{clock.offset}</span></div>
                                    <div className="amc-zone-city">{clock.city}</div>
                                </div>
                                <div className="amc-zone-value">
                                    <div className="amc-zone-digits">{clock.time}</div>
                                    <div className="amc-zone-date">{clock.date}</div>
                                </div>
                            </section>
                        ))}
                    </aside>
                </div>

                {metarProblem && (
                    <div role="alert"
                         className="amc-metar-alert mx-[2vw] mb-[0.8vh] flex shrink-0 items-center gap-[0.8vw] rounded-xl border border-red-400/40 bg-red-500/15 px-[1.2vw] py-[0.7vh]">
                        <AlertTriangle className="shrink-0 text-red-300" style={{ width: 'min(1.4vw,2.4vh)', height: 'min(1.4vw,2.4vh)' }} />
                        <div className="min-w-0">
                            <div style={{ fontSize: 'min(0.95vw,1.6vh)' }} className="font-black leading-snug text-red-100">
                                {metarProblem.message}
                            </div>
                            <div style={{ fontSize: 'min(0.75vw,1.3vh)' }} className="font-bold text-red-200/70">
                                {obs ? L.metarLastKnown[lang] : L.metarFallback[lang]}
                            </div>
                        </div>
                    </div>
                )}

                <main className="amc-panels grid min-h-0 flex-1 grid-cols-[1.25fr_1fr_1fr] gap-[1.2vw] overflow-hidden px-[2vw] pb-[0.8vh]">

                    <Card label={L.wind[lang]} accent={accent} icon={<Wind style={iconSize} />}>
                        <div className="flex min-h-0 items-center gap-[1.2vw]">
                            <WindRose deg={windDeg} runwayHeading={runwayHeading} color={accent} />
                            <div className="min-w-0">
                                <div className="flex items-baseline gap-[0.4vw]">
                                    <span style={{ fontSize: 'min(5vw,8.5vh)', lineHeight: 1 }} className="font-black tabular-nums">
                                        {windKt !== null ? Math.round(windKt) : dash}
                                    </span>
                                    <span style={{ fontSize: 'min(1.3vw,2.1vh)' }} className="font-bold text-white/60">kt</span>
                                    {obs?.wind_gust_kt != null && (
                                        <span style={{ fontSize: 'min(1.3vw,2.1vh)' }} className="font-black tabular-nums text-amber-300">
                                            G{obs.wind_gust_kt}
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: 'min(0.9vw,1.6vh)' }} className="font-bold tabular-nums text-white/45">
                                    {windKmh !== null ? `${windKmh.toFixed(1)} km/jam` : ''}
                                </div>
                                <div style={{ fontSize: 'min(1.15vw,1.9vh)' }} className="mt-[0.5vh] truncate font-black tracking-[0.1em]">
                                    {windDeg !== null
                                        ? `${compassLabel(windDeg, lang)} · ${compassPoint(windDeg)} ${String(Math.round(windDeg)).padStart(3, '0')}°`
                                        : obs?.wind_variable
                                            ? (lang === 'id' ? 'ARAH BERUBAH-UBAH (VRB)' : 'VARIABLE (VRB)')
                                            : (lang === 'id' ? 'Arah belum tersedia' : 'Direction unavailable')}
                                </div>
                                {obs?.wind_var_from != null && obs.wind_var_to != null && (
                                    <div style={{ fontSize: 'min(0.9vw,1.6vh)' }} className="font-bold tabular-nums text-white/45">
                                        {lang === 'id' ? 'Bervariasi' : 'Varying'} {String(obs.wind_var_from).padStart(3, '0')}°–{String(obs.wind_var_to).padStart(3, '0')}°
                                    </div>
                                )}

                                {comp && (
                                    <div className="mt-[0.7vh] flex flex-wrap items-center gap-x-[0.8vw] gap-y-[0.3vh]">
                                        {settings?.runway_kode && (
                                            <span style={{ fontSize: 'min(0.8vw,1.35vh)' }}
                                                  className="rounded bg-white/10 px-[0.5vw] py-[0.2vh] font-black tracking-[0.2em]">
                                                RWY {settings.runway_kode}
                                            </span>
                                        )}
                                        <span style={{ fontSize: 'min(1vw,1.7vh)' }} className="font-black tabular-nums">
                                            {comp.head >= 0 ? L.headwind[lang] : L.tailwind[lang]} {Math.abs(Math.round(comp.head))} kt
                                        </span>
                                        <span style={{ fontSize: 'min(1vw,1.7vh)' }} className="font-black tabular-nums">
                                            {L.crosswind[lang]} {Math.round(comp.cross)} kt {comp.from === 'right' ? '→' : '←'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card label={L.visibility[lang]} accent="#6ee7b7" icon={<Eye style={iconSize} />}>
                        <div className="amc-visibility-symbol" aria-hidden="true"><Eye strokeWidth={1.2} /></div>
                        {/* Nilai utama mengikuti teks resmi BMKG (mis. "> 10 km"), sama seperti
                            situs BMKG; angka meter hanya dipakai bila teksnya tidak ada (input manual). */}
                        <div style={{ fontSize: 'min(6.5vw,11vh)', lineHeight: 1, color: visColor }} className="font-black tabular-nums whitespace-nowrap">
                            {visText ?? (vis !== null ? formatVisibility(vis) : dash)}
                        </div>
                        {visText === null && vis === null && (
                            <div style={{ fontSize: 'min(1vw,1.7vh)' }} className="mt-[0.3vh] font-bold text-white/50">
                                {lang === 'id' ? 'Data jarak pandang belum tersedia' : 'Visibility data unavailable'}
                            </div>
                        )}
                        {/* Pita status: kondisi buruk harus terbaca tanpa membaca angkanya. */}
                        <div className="mt-[0.9vh] h-[1.1vh] w-full overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full transition-all duration-700"
                                 style={{
                                     width: vis !== null ? `${Math.min(100, (vis / 10000) * 100)}%` : '0%',
                                     background: visColor,
                                 }} />
                        </div>
                    </Card>

                    <Card label={L.weather[lang]} accent="#fcd34d" icon={<Thermometer style={iconSize} />}>
                        <div className="amc-weather-summary flex min-w-0 items-center gap-[1vw]">
                            <WeatherIcon desc={obs ? (describeMetarWeather(obs.present_weather, 'en') ?? describeMetarClouds(obs.clouds, 'en')) : (weather?.kondisi_cuaca ?? null)} className="amc-weather-icon shrink-0 text-yellow-300" />
                            <div className="min-w-0">
                                <div className="flex items-baseline gap-[0.3vw]">
                                    <span style={{ fontSize: 'min(4vw,7vh)', lineHeight: 1 }} className="font-black tabular-nums">
                                        {obs ? (obs.temperature_c ?? dash) : (weather?.suhu ?? dash)}
                                    </span>
                                    <span style={{ fontSize: 'min(1.3vw,2.1vh)' }} className="font-bold text-white/60">°C</span>
                                </div>
                                <div style={{ fontSize: 'min(1.15vw,1.9vh)' }} className="truncate font-bold">
                                    {obs
                                        ? (describeMetarWeather(obs.present_weather, lang) ?? describeMetarClouds(obs.clouds, lang) ?? weather?.kondisi_cuaca ?? L.noData[lang])
                                        : (weather?.kondisi_cuaca ?? L.noData[lang])}
                                </div>
                            </div>
                        </div>
                        <div className="amc-weather-stats mt-[0.9vh] grid grid-cols-2 gap-[1vw]">
                            {(obs
                                ? [
                                    { label: L.qnh[lang], value: obs.qnh_hpa, unit: ' hPa', bar: null },
                                    { label: L.dewPoint[lang], value: obs.dew_point_c, unit: ' °C', bar: null },
                                ]
                                : [
                                    { label: L.humidity[lang], value: weather?.kelembapan ?? null, unit: '%', bar: weather?.kelembapan ?? null },
                                    { label: L.clouds[lang], value: weather?.tutupan_awan ?? null, unit: '%', bar: weather?.tutupan_awan ?? null },
                                ]
                            ).map((item) => (
                                <div key={item.label}>
                                    <div style={{ fontSize: 'min(0.75vw,1.3vh)' }} className="font-black tracking-[0.2em] text-white/40">
                                        {item.label}
                                    </div>
                                    <div style={{ fontSize: 'min(2vw,3.4vh)' }} className="font-black tabular-nums">
                                        {item.value !== null ? `${item.value}${item.unit}` : dash}
                                    </div>
                                    {item.bar !== null && (
                                        <div className="mt-[0.3vh] h-[0.6vh] w-full overflow-hidden rounded-full bg-white/10">
                                            <div className="h-full rounded-full bg-white/40"
                                                 style={{ width: `${Math.min(100, Math.max(0, item.bar))}%` }} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                </main>

                <footer className="amc-footer flex shrink-0 items-center justify-between gap-[1vw] border-t border-white/10 bg-black/40 px-[2vw] py-[0.7vh]">
                    <div className="min-w-0">
                    {/* Sumber data selalu tercantum dan tidak ikut terpotong oleh teks METAR mentah. */}
                    <div style={{ fontSize: 'min(0.8vw,1.4vh)' }} className="amc-data-source truncate font-black tracking-[0.15em] text-sky-200/80">
                        {L.dataSource[lang]}:{' '}
                        {obs
                            ? `${L.sourceMetar[lang]} · ${metar?.source ?? 'web-aviation.bmkg.go.id'} · ${metar?.icao ?? ''}`
                            : `${L.sourceForecast[lang]} · api.bmkg.go.id${weather?.lokasi ? ` · ${weather.lokasi}` : ''}`}
                    </div>
                    <div style={{ fontSize: 'min(0.8vw,1.4vh)' }} className="truncate font-bold tracking-[0.15em] text-white/50">
                        {obs ? (
                            <>
                                METAR {metar?.icao} · {L.observed[lang]} {obsTime} UTC
                                <span className="ml-[0.6vw] font-mono text-white/35">{obs.raw_text}</span>
                            </>
                        ) : (
                            <>
                                {L.source[lang]}
                                {validText ? ` · ${L.validAt[lang]} ${validText}` : ''}
                            </>
                        )}
                        {' · '}
                        <span style={{ color: freshColor }}>
                            {L.updated[lang]} {ageMin === null ? L.never[lang] : `${ageMin} ${L.minutesAgo[lang]}`}
                        </span>
                    </div>
                    </div>
                    <div style={{ fontSize: 'min(0.8vw,1.4vh)' }}
                         className="shrink-0 rounded border border-amber-400/40 bg-amber-500/15 px-[0.8vw] py-[0.25vh] font-black tracking-[0.15em] text-amber-300">
                        {obs ? L.metarWarning[lang] : L.warning[lang]}
                    </div>
                </footer>
            </div>
        </FidsLayout>
    );
}
