import { useEffect, useState, useCallback } from 'react';
import FidsLayout from '@/Layouts/FidsLayout';
import { useNtpClock } from '@/hooks/useNtpClock';
import { getNtpStatus } from '@/lib/timezoneClock';

interface WorldClockSettings {
    show_utc: boolean;
    show_wib: boolean;
    show_wita: boolean;
    show_wit: boolean;
    format_waktu: '12h' | '24h';
    show_seconds: boolean;
    show_date: boolean;
    tema_warna: string;
    accent_color: string;
    judul_layar: string | null;
    nama_bandara: string | null;
    show_nama_bandara: boolean;
    show_analog_clock: boolean;
    show_ntp_status: boolean;
    use_background_image: boolean;
    background_header_url: string | null;
    bahasa: 'id' | 'en';
}

interface ZoneConfig {
    key: keyof WorldClockSettings;
    id: 'utc' | 'wib' | 'wita' | 'wit';
    timezone: string;
    label: string;
    sub: { id: string; en: string };
    offset: string;
    color: string;
    flag: boolean;
}

const ZONES: ZoneConfig[] = [
    { key: 'show_utc',  id: 'utc',  timezone: 'UTC',           label: 'UTC',  sub: { id: 'WAKTU UNIVERSAL',       en: 'UNIVERSAL TIME' },  offset: 'UTC+0', color: '#38bdf8', flag: false },
    { key: 'show_wib',  id: 'wib',  timezone: 'Asia/Jakarta',  label: 'WIB',  sub: { id: 'WAKTU INDONESIA BARAT', en: 'WESTERN INDONESIA' }, offset: 'UTC+7', color: '#22d3ee', flag: true },
    { key: 'show_wita', id: 'wita', timezone: 'Asia/Makassar', label: 'WITA', sub: { id: 'WAKTU INDONESIA TENGAH', en: 'CENTRAL INDONESIA' }, offset: 'UTC+8', color: '#f5b301', flag: true },
    { key: 'show_wit',  id: 'wit',  timezone: 'Asia/Jayapura', label: 'WIT',  sub: { id: 'WAKTU INDONESIA TIMUR', en: 'EASTERN INDONESIA' }, offset: 'UTC+9', color: '#22c55e', flag: true },
];

function getTimeParts(date: Date, timezone: string, format: '12h' | '24h') {
    const h = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', hour12: false }).format(date);
    const m = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, minute: '2-digit' }).format(date);
    const s = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, second: '2-digit' }).format(date);

    let hour = h === '24' ? '00' : h;
    let ampm = '';
    if (format === '12h') {
        const h24 = parseInt(h);
        ampm = h24 >= 12 ? 'PM' : 'AM';
        hour = (h24 % 12 || 12).toString().padStart(2, '0');
    }

    return { hour, minute: m, second: s, ampm, hourNum: parseInt(hour), minuteNum: parseInt(m), secondNum: parseInt(s) };
}

function formatDateLong(date: Date, timezone: string, lang: 'id' | 'en'): string {
    const locale = lang === 'id' ? 'id-ID' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
        timeZone: timezone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).format(date).toUpperCase();
}

export default function WorldClockDisplay() {
    const [settings, setSettings] = useState<WorldClockSettings | null>(null);
    const { now } = useNtpClock(60_000, 200);
    const [ntpSynced, setNtpSynced] = useState(false);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/fids/world-clock-settings');
            if (res.ok) setSettings((await res.json()).data);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        fetchSettings();
        const interval = setInterval(fetchSettings, 30000);
        return () => clearInterval(interval);
    }, [fetchSettings]);

    useEffect(() => {
        const check = setInterval(() => setNtpSynced(getNtpStatus() === 'synced'), 5000);
        return () => clearInterval(check);
    }, []);

    if (!settings) {
        return (
            <FidsLayout title="Master Clock">
                <div className="h-screen bg-[#06122b] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
                        <p className="text-white/40 text-lg font-medium tracking-wider">LOADING...</p>
                    </div>
                </div>
            </FidsLayout>
        );
    }

    const lang = settings.bahasa || 'id';
    const hero = ZONES.find((z) => z.id === 'wita')!;
    const satellites = ZONES.filter((z) => z.id !== 'wita' && settings[z.key]);

    const title = settings.judul_layar || 'MASTER CLOCK';
    const airport = settings.nama_bandara || 'APT PRANOTO AAP SAMARINDA';
    const ntpLabel = ntpSynced
        ? (lang === 'id' ? 'NTP TERSINKRON' : 'NTP SYNCED')
        : (lang === 'id' ? 'WAKTU LOKAL' : 'LOCAL TIME');

    return (
        <FidsLayout title="Master Clock">
            <div className="h-screen w-screen overflow-hidden select-none relative font-sans"
                 style={{ background: 'radial-gradient(120% 90% at 50% 18%, #14366e 0%, #0b1f45 45%, #050d23 100%)' }}>

                {/* Optional uploaded background */}
                {settings.use_background_image && settings.background_header_url && (
                    <>
                        <div className="absolute inset-0 z-0">
                            <img src={settings.background_header_url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute inset-0 z-0 bg-[#050d23]/70" />
                    </>
                )}

                {/* Ambient glow + dots */}
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '46px 46px' }} />
                <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[55vw] h-[60vh] rounded-full opacity-[0.18] blur-[130px]" style={{ background: hero.color }} />

                {/* Header */}
                <header className="absolute top-[3.5vh] left-[2.5vw] right-[2.5vw] z-30 flex items-start justify-between">
                    <div className="flex items-center gap-[1vw]">
                        <div className="w-[3.4vw] h-[3.4vw] rounded-full flex items-center justify-center ring-2 ring-amber-400/40 bg-amber-400/10">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#f5b301" strokeWidth="1.8" className="w-[2vw] h-[2vw]">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                        </div>
                        <div>
                            <h1 style={{ fontSize: '2.1vw' }} className="font-black tracking-tight text-white leading-none drop-shadow">
                                {title}
                            </h1>
                            {settings.show_nama_bandara && (
                                <p style={{ fontSize: '0.85vw' }} className="text-sky-300/80 font-bold tracking-[0.3em] uppercase mt-[0.5vh]">
                                    {airport}
                                </p>
                            )}
                        </div>
                    </div>

                    {settings.show_ntp_status && (
                        <div className={`flex items-center gap-[0.55vw] px-[1.1vw] py-[0.8vh] rounded-full border backdrop-blur-md ${ntpSynced ? 'bg-emerald-500/10 border-emerald-400/40' : 'bg-amber-500/10 border-amber-400/40'}`}>
                            <span className="relative flex items-center justify-center">
                                <span className={`w-[0.5vw] h-[0.5vw] rounded-full ${ntpSynced ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                <span className={`absolute w-[0.5vw] h-[0.5vw] rounded-full animate-ping ${ntpSynced ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            </span>
                            <span style={{ fontSize: '0.8vw' }} className={`font-bold tracking-[0.18em] ${ntpSynced ? 'text-emerald-300' : 'text-amber-300'}`}>
                                {ntpLabel}
                            </span>
                        </div>
                    )}
                </header>

                {/* Hero WITA clock (center) */}
                <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 z-20">
                    <HeroClock zone={hero} now={now} settings={settings} lang={lang} />
                </div>

                {/* Satellites */}
                {satellites.map((zone) => {
                    const pos =
                        zone.id === 'utc' ? 'top-1/2 -translate-y-1/2 left-[3vw]'
                        : zone.id === 'wib' ? 'bottom-[4vh] left-1/2 -translate-x-1/2'
                        : 'top-1/2 -translate-y-1/2 right-[3vw]'; // wit
                    return (
                        <div key={zone.id} className={`absolute z-30 ${pos}`}>
                            <SatelliteCard zone={zone} now={now} settings={settings} lang={lang} />
                        </div>
                    );
                })}

                {/* Batik-style bottom band */}
                <div className="absolute bottom-0 left-0 right-0 h-[3vh] z-10"
                     style={{
                         background: 'linear-gradient(90deg, #1a1206, #3a2a0a, #1a1206)',
                         borderTop: '2px solid rgba(245,179,1,0.55)',
                     }}>
                    <div className="absolute inset-0 opacity-50"
                         style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(245,179,1,0.5) 0 8px, transparent 8px 16px), repeating-linear-gradient(-45deg, rgba(245,179,1,0.25) 0 8px, transparent 8px 16px)' }} />
                </div>
            </div>
        </FidsLayout>
    );
}

/* ─── Hero WITA Clock ─── */
function HeroClock({ zone, now, settings, lang }: { zone: ZoneConfig; now: Date; settings: WorldClockSettings; lang: 'id' | 'en'; }) {
    const { hour, minute, second, secondNum } = getTimeParts(now, zone.timezone, settings.format_waktu);
    const dateStr = settings.show_date ? formatDateLong(now, zone.timezone, lang) : null;
    const C = zone.color;

    return (
        <div className="relative flex items-center justify-center" style={{ width: '56vh', height: '56vh' }}>
            {/* Square frame + glow */}
            <div className="absolute inset-0 rounded-[3vh]"
                 style={{ border: `2px solid ${C}55`, boxShadow: `0 0 40px ${C}22` }} />

            {/* Corner accents (tech-box look) */}
            {[
                'top-[2%] left-[2%] border-t-[3px] border-l-[3px] rounded-tl-[2.4vh]',
                'top-[2%] right-[2%] border-t-[3px] border-r-[3px] rounded-tr-[2.4vh]',
                'bottom-[2%] left-[2%] border-b-[3px] border-l-[3px] rounded-bl-[2.4vh]',
                'bottom-[2%] right-[2%] border-b-[3px] border-r-[3px] rounded-br-[2.4vh]',
            ].map((c, i) => (
                <div key={i} className={`absolute w-[5vh] h-[5vh] ${c}`}
                     style={{ borderColor: C, filter: `drop-shadow(0 0 6px ${C}aa)` }} />
            ))}

            {/* Inner face */}
            <div className="absolute rounded-[2.5vh]"
                 style={{ inset: '4.5%',
                          background: `radial-gradient(circle at 50% 38%, rgba(10,16,30,0.92) 55%, ${C}1a 100%)`,
                          border: `1px solid ${C}33`, boxShadow: `inset 0 0 60px rgba(0,0,0,0.7), 0 0 40px ${C}22` }} />

            {/* Seconds progress bar (bottom edge) */}
            <div className="absolute left-[10%] right-[10%] bottom-[6.5%] h-[0.55vh] rounded-full overflow-hidden z-[15]" style={{ background: `${C}22` }}>
                <div className="h-full rounded-full"
                     style={{ width: `${(secondNum / 60) * 100}%`, background: C, filter: `drop-shadow(0 0 5px ${C})` }} />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center" style={{ width: '78%' }}>
                {zone.flag && <IndoFlag className="w-[2.6vh] h-[1.7vh] mb-[0.6vh]" />}
                <h2 style={{ fontSize: '4.4vh', color: C }} className="font-black tracking-[0.12em] leading-none drop-shadow">
                    {zone.label}
                </h2>
                <p style={{ fontSize: '1.35vh' }} className="text-white/70 font-bold tracking-[0.25em] mt-[0.5vh]">
                    {zone.sub[lang]}
                </p>

                {dateStr && (
                    <p style={{ fontSize: '1.5vh' }} className="text-white/85 font-bold tracking-[0.18em] mt-[1.8vh]">
                        {dateStr}
                    </p>
                )}

                <div className="mt-[0.8vh]">
                    <SevenSegTime hour={hour} minute={minute} second={second} size="7vh" color={C} />
                </div>

                <p style={{ fontSize: '1.9vh', color: C }} className="font-black tracking-[0.3em] mt-[0.8vh]">
                    {zone.offset}
                </p>

                <IndonesiaMap color={C} className="w-[27vh] h-[9.9vh] mt-[1.2vh]" />

                <div className="flex items-center gap-[0.5vw] mt-[0.6vh]">
                    <svg viewBox="0 0 24 24" fill={C} className="w-[1.8vh] h-[1.8vh]">
                        <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
                    </svg>
                    <span style={{ fontSize: '1.5vh' }} className="font-bold tracking-[0.18em] text-white/90">
                        SAMARINDA, KALIMANTAN TIMUR
                    </span>
                </div>
            </div>
        </div>
    );
}

/* ─── Satellite Card ─── */
function SatelliteCard({ zone, now, settings, lang }: { zone: ZoneConfig; now: Date; settings: WorldClockSettings; lang: 'id' | 'en'; }) {
    const { hour, minute, second, hourNum, minuteNum, secondNum } = getTimeParts(now, zone.timezone, settings.format_waktu);
    const C = zone.color;

    return (
        <div className="rounded-2xl backdrop-blur-md px-[1.4vw] py-[1.6vh] shadow-2xl"
             style={{ background: 'rgba(8,16,34,0.72)', border: `1.5px solid ${C}55`, boxShadow: `0 0 30px ${C}22` }}>
            {/* Title row */}
            <div className="flex items-center gap-[0.6vw] mb-[1vh]">
                {zone.flag
                    ? <IndoFlag className="w-[2vh] h-[1.3vh]" />
                    : <span className="w-[1.6vh] h-[1.6vh] rounded-full" style={{ background: `${C}33`, border: `1px solid ${C}` }} />}
                <span style={{ fontSize: '2vh', color: C }} className="font-black tracking-[0.1em] leading-none">{zone.label}</span>
                <span style={{ fontSize: '0.95vh' }} className="text-white/55 font-bold tracking-[0.18em]">{zone.sub[lang]}</span>
            </div>

            {/* Body: analog + digital */}
            <div className="flex items-center gap-[1vw]">
                <AnalogMini hourNum={hourNum} minuteNum={minuteNum} secondNum={secondNum} color={C} className="w-[7vh] h-[7vh]" />
                <SevenSegTime hour={hour} minute={minute} second={second} size="4.3vh" color={C} />
            </div>

            {/* Offset badge */}
            <div className="mt-[1vh] rounded-md text-center py-[0.4vh]" style={{ background: `${C}1f`, border: `1px solid ${C}44` }}>
                <span style={{ fontSize: '1.1vh', color: C }} className="font-black tracking-[0.25em]">{zone.offset}</span>
            </div>
        </div>
    );
}

/* ─── Mini analog clock ─── */
function AnalogMini({ hourNum, minuteNum, secondNum, color, className }: { hourNum: number; minuteNum: number; secondNum: number; color: string; className?: string; }) {
    const hAng = ((hourNum % 12) + minuteNum / 60) * 30;
    const mAng = minuteNum * 6;
    const sAng = secondNum * 6;
    const hand = (deg: number, len: number) => {
        const r = ((deg - 90) * Math.PI) / 180;
        return { x: 50 + len * Math.cos(r), y: 50 + len * Math.sin(r) };
    };
    const h = hand(hAng, 22), m = hand(mAng, 32), s = hand(sAng, 36);
    return (
        <svg viewBox="0 0 100 100" className={className}>
            <circle cx="50" cy="50" r="46" fill="rgba(0,0,0,0.45)" stroke={`${color}66`} strokeWidth="2.5" />
            {Array.from({ length: 12 }, (_, i) => {
                const a = ((i * 30 - 90) * Math.PI) / 180;
                return <line key={i} x1={50 + 40 * Math.cos(a)} y1={50 + 40 * Math.sin(a)} x2={50 + 44 * Math.cos(a)} y2={50 + 44 * Math.sin(a)} stroke={`${color}99`} strokeWidth="2" strokeLinecap="round" />;
            })}
            <line x1="50" y1="50" x2={h.x} y2={h.y} stroke="white" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="50" y1="50" x2={m.x} y2={m.y} stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="50" y1="50" x2={s.x} y2={s.y} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="3.5" fill={color} />
        </svg>
    );
}

/* ─── Indonesian flag ─── */
function IndoFlag({ className }: { className?: string }) {
    return (
        <span className={`inline-flex flex-col overflow-hidden rounded-[2px] ring-1 ring-white/30 ${className ?? ''}`}>
            <span className="flex-1 bg-[#e63946]" />
            <span className="flex-1 bg-white" />
        </span>
    );
}

/* ─── Real Indonesia map (recolored via CSS mask) + Samarinda pin ─── */
function IndonesiaMap({ color, className }: { color: string; className?: string }) {
    // Posisi Samarinda di dalam bounding-box peta (lon 95–141°E, lat 6°N–11°S)
    // x = (117.1-95)/46 ≈ 48% ; y = (6-(-0.5))/17 ≈ 38%
    const PIN_LEFT = '48%';
    const PIN_TOP = '38%';
    const mask = {
        WebkitMaskImage: 'url(/images/indonesia.svg)',
        maskImage: 'url(/images/indonesia.svg)',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
    } as const;

    return (
        <div className={`relative ${className ?? ''}`}>
            {/* Peta Indonesia asli, diwarnai dengan zona + glow */}
            <div className="absolute inset-0" style={{ ...mask, backgroundColor: color, opacity: 0.85, filter: `drop-shadow(0 0 6px ${color})` }} />
            {/* Highlight tipis di tepi agar lebih tegas */}
            <div className="absolute inset-0" style={{ ...mask, backgroundColor: '#ffffff', opacity: 0.12 }} />

            {/* Pin Samarinda + cincin radar */}
            <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: PIN_LEFT, top: PIN_TOP }}>
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1.6vh] h-[1.6vh] rounded-full"
                      style={{ background: '#ffffff', filter: `drop-shadow(0 0 8px ${color})` }} />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1.6vh] h-[1.6vh] rounded-full animate-ping"
                      style={{ background: color }} />
            </div>
        </div>
    );
}

/* ─── Seven-segment time HH:MM:SS ─── */
function SevenSegTime({ hour, minute, second, size, color }: { hour: string; minute: string; second: string; size: string; color: string; }) {
    return (
        <div className="flex items-center justify-center">
            <SevenSegmentDigit digit={hour[0]} size={size} color={color} />
            <SevenSegmentDigit digit={hour[1]} size={size} color={color} />
            <SevenSegmentColon size={size} color={color} />
            <SevenSegmentDigit digit={minute[0]} size={size} color={color} />
            <SevenSegmentDigit digit={minute[1]} size={size} color={color} />
            <SevenSegmentColon size={size} color={color} />
            <SevenSegmentDigit digit={second[0]} size={size} color={color} />
            <SevenSegmentDigit digit={second[1]} size={size} color={color} />
        </div>
    );
}

const SEGMENT_MAP: Record<string, boolean[]> = {
    '0': [true, true, true, true, true, true, false],
    '1': [false, true, true, false, false, false, false],
    '2': [true, true, false, true, true, false, true],
    '3': [true, true, true, true, false, false, true],
    '4': [false, true, true, false, false, true, true],
    '5': [true, false, true, true, false, true, true],
    '6': [true, false, true, true, true, true, true],
    '7': [true, true, true, false, false, false, false],
    '8': [true, true, true, true, true, true, true],
    '9': [true, true, true, true, false, true, true],
};

function SevenSegmentDigit({ digit, size, color }: { digit: string; size: string; color: string }) {
    const segments = SEGMENT_MAP[digit] || SEGMENT_MAP['0'];
    const numSize = parseFloat(size);
    const unit = size.replace(/[0-9.]/g, '');
    const w = numSize * 0.62;
    const margin = numSize * 0.04;
    const off = `${color}1f`;
    const seg = (i: number, points: string) => (
        <polygon points={points} fill={segments[i] ? color : off}
                 style={{ filter: segments[i] ? `drop-shadow(0 0 5px ${color})` : 'none' }} />
    );

    return (
        <svg viewBox="0 0 60 100" style={{ width: `${w}${unit}`, height: `${numSize}${unit}`, margin: `0 ${margin}${unit}` }} className="block">
            {seg(0, '10,2 50,2 45,12 15,12')}
            {seg(1, '52,4 52,47 46,42 46,12')}
            {seg(2, '52,53 52,96 46,88 46,58')}
            {seg(3, '10,98 50,98 45,88 15,88')}
            {seg(4, '8,53 8,96 14,88 14,58')}
            {seg(5, '8,4 8,47 14,42 14,12')}
            {seg(6, '12,47 48,47 45,53 15,53')}
        </svg>
    );
}

function SevenSegmentColon({ size, color }: { size: string; color: string }) {
    const numSize = parseFloat(size);
    const unit = size.replace(/[0-9.]/g, '');
    const w = numSize * 0.26;
    return (
        <svg viewBox="0 0 25 100" style={{ width: `${w}${unit}`, height: `${numSize}${unit}` }} className="block animate-pulse">
            <circle cx="12.5" cy="36" r="5.5" fill={color} style={{ filter: `drop-shadow(0 0 7px ${color})` }} />
            <circle cx="12.5" cy="64" r="5.5" fill={color} style={{ filter: `drop-shadow(0 0 7px ${color})` }} />
        </svg>
    );
}
