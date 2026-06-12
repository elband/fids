import { useEffect, useState, useCallback, useMemo } from 'react';
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

interface TimeZoneConfig {
    key: string;
    label: string;
    timezone: string;
    offset: string;
    region: string;
}

const ALL_ZONES: TimeZoneConfig[] = [
    { key: 'show_utc', label: 'UTC', timezone: 'UTC', offset: '+0', region: 'GLOBAL' },
    { key: 'show_wib', label: 'WIB', timezone: 'Asia/Jakarta', offset: '+7', region: 'INDONESIA' },
    { key: 'show_wita', label: 'WITA', timezone: 'Asia/Makassar', offset: '+8', region: 'INDONESIA' },
    { key: 'show_wit', label: 'WIT', timezone: 'Asia/Jayapura', offset: '+9', region: 'INDONESIA' },
];

function getTimeParts(date: Date, timezone: string, format: '12h' | '24h') {
    const h = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', hour12: false }).format(date);
    const m = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, minute: '2-digit' }).format(date);
    const s = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, second: '2-digit' }).format(date);

    let hour = h;
    let ampm = '';
    if (format === '12h') {
        const h24 = parseInt(h);
        ampm = h24 >= 12 ? 'PM' : 'AM';
        const h12 = h24 % 12 || 12;
        hour = h12.toString().padStart(2, '0');
    }

    return { hour, minute: m, second: s, ampm, secondNum: parseInt(s) };
}

function formatDateShort(date: Date, timezone: string, lang: 'id' | 'en'): string {
    const locale = lang === 'id' ? 'id-ID' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

export default function WorldClockDisplay() {
    const [settings, setSettings] = useState<WorldClockSettings | null>(null);
    const { now } = useNtpClock(60_000, 200);
    const [ntpSynced, setNtpSynced] = useState(false);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/fids/world-clock-settings');
            if (res.ok) {
                const json = await res.json();
                setSettings(json.data);
            }
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
            <FidsLayout title="World Clock">
                <div className="h-screen bg-[#050a18] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-white/40 text-lg font-medium tracking-wider">LOADING...</p>
                    </div>
                </div>
            </FidsLayout>
        );
    }

    const visibleZones = ALL_ZONES.filter((z) => settings[z.key as keyof WorldClockSettings]);
    const lang = settings.bahasa || 'id';

    const t = {
        title: settings.judul_layar || (lang === 'id' ? 'WAKTU DUNIA' : 'WORLD TIME'),
        ntpSynced: lang === 'id' ? 'NTP TERSINKRON' : 'NTP SYNCED',
        localTime: lang === 'id' ? 'WAKTU LOKAL' : 'LOCAL TIME',
        footer: lang === 'id' ? 'Tampilan Waktu Presisi • Sinkronisasi NTP' : 'Precision Time Display • NTP Synchronized',
        local: lang === 'id' ? 'LOKAL' : 'LOCAL',
    };

    return (
        <FidsLayout title="World Clock">
            <div className="h-screen w-screen overflow-hidden select-none relative" style={{ background: `linear-gradient(170deg, ${settings.tema_warna} 0%, #000509 100%)` }}>

                {/* Background image from FIDS settings */}
                {settings.use_background_image && settings.background_header_url && (
                    <>
                        <div className="absolute inset-0 z-0">
                            <img src={settings.background_header_url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute inset-0 z-0 bg-black/60" />
                    </>
                )}

                {/* Subtle dot pattern */}
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

                {/* Ambient glow */}
                <div className="absolute top-[-30%] left-[20%] w-[40vw] h-[60vh] rounded-full opacity-[0.06] blur-[120px]" style={{ background: settings.accent_color }} />
                <div className="absolute bottom-[-20%] right-[10%] w-[30vw] h-[40vh] rounded-full opacity-[0.04] blur-[100px]" style={{ background: settings.accent_color }} />

                {/* Layout */}
                <div className="relative z-10 h-full flex flex-col px-[3vw] py-[2vh]">

                    {/* Header */}
                    <header className="shrink-0 flex items-center justify-between">
                        <div className="flex items-center gap-[1.2vw]">
                            <div className="w-[3.2vw] h-[3.2vw] rounded-full border flex items-center justify-center" style={{ borderColor: `${settings.accent_color}50` }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-[1.8vw] h-[1.8vw]" style={{ color: settings.accent_color }}>
                                    <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeWidth="1.5" />
                                </svg>
                            </div>
                            <div>
                                <h1 style={{ fontSize: '1.8vw' }} className="font-black tracking-tight text-white leading-none">
                                    {t.title}
                                </h1>
                                {settings.show_nama_bandara && settings.nama_bandara && (
                                    <p style={{ fontSize: '0.7vw' }} className="text-white/35 font-semibold tracking-[0.25em] uppercase mt-[0.3vh]">
                                        {settings.nama_bandara}
                                    </p>
                                )}
                            </div>
                        </div>

                        {settings.show_ntp_status && (
                            <div className={`flex items-center gap-[0.5vw] px-[1vw] py-[0.6vh] rounded-full border backdrop-blur-sm ${ntpSynced ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                                <div className="relative flex items-center justify-center">
                                    <div className={`w-[0.45vw] h-[0.45vw] rounded-full ${ntpSynced ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                    <div className={`absolute w-[0.45vw] h-[0.45vw] rounded-full animate-ping ${ntpSynced ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                </div>
                                <span style={{ fontSize: '0.65vw' }} className={`font-bold tracking-[0.15em] ${ntpSynced ? 'text-emerald-300' : 'text-amber-300'}`}>
                                    {ntpSynced ? t.ntpSynced : t.localTime}
                                </span>
                            </div>
                        )}
                    </header>

                    {/* Clock Cards */}
                    <main className="flex-1 flex items-center justify-center">
                        <div className="flex items-stretch gap-[1.5vw] w-full justify-center">
                            {visibleZones.map((zone) => (
                                <ClockCard
                                    key={zone.key}
                                    zone={zone}
                                    now={now}
                                    settings={settings}
                                    isLocal={zone.key === 'show_wita'}
                                    total={visibleZones.length}
                                    lang={lang}
                                    localLabel={t.local}
                                />
                            ))}
                        </div>
                    </main>

                    {/* Footer */}
                    <footer className="shrink-0 flex items-center justify-center">
                        <div className="flex items-center gap-[1.5vw]">
                            <div className="w-[6vw] h-px" style={{ background: `linear-gradient(to right, transparent, ${settings.accent_color}30)` }} />
                            <p style={{ fontSize: '0.65vw' }} className="text-white/20 font-semibold tracking-[0.3em] uppercase">
                                {t.footer}
                            </p>
                            <div className="w-[6vw] h-px" style={{ background: `linear-gradient(to left, transparent, ${settings.accent_color}30)` }} />
                        </div>
                    </footer>
                </div>
            </div>
        </FidsLayout>
    );
}

/* â”€â”€â”€ Animated Clock Card â”€â”€â”€ */
function ClockCard({ zone, now, settings, isLocal, total, lang, localLabel }: {
    zone: TimeZoneConfig;
    now: Date;
    settings: WorldClockSettings;
    isLocal: boolean;
    total: number;
    lang: 'id' | 'en';
    localLabel: string;
}) {
    const { hour, minute, second, ampm, secondNum } = getTimeParts(now, zone.timezone, settings.format_waktu);
    const dateStr = settings.show_date ? formatDateShort(now, zone.timezone, lang) : null;

    const secondDeg = (secondNum / 60) * 360;

    // Size of the circular card â€” balanced to fit screen
    const cardSize = total <= 2 ? '50vh' : total === 3 ? '44vh' : '38vh';
    const timeFontSize = total <= 2 ? '5vw' : total === 3 ? '3.8vw' : '3vw';
    const labelFontSize = total <= 2 ? '1.8vw' : total === 3 ? '1.4vw' : '1.2vw';

    return (
        <div className="flex flex-col items-center gap-[1vh]">
            {/* Circular Card */}
            <div
                className="relative flex items-center justify-center"
                style={{ width: cardSize, height: cardSize }}
            >
                {/* SVG ring animation (outer edge of circle) */}
                <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
                    {/* Background track */}
                    <circle cx="100" cy="100" r="96" fill="none" stroke={isLocal ? `${settings.accent_color}25` : 'rgba(255,255,255,0.06)'} strokeWidth="4" />

                    {/* Tick marks around the circle */}
                    {Array.from({ length: 60 }, (_, i) => {
                        const angle = (i / 60) * 360 - 90;
                        const rad = (angle * Math.PI) / 180;
                        const isMajor = i % 5 === 0;
                        const isActive = i <= secondNum;
                        const innerR = isMajor ? 85 : 88;
                        const outerR = 93;
                        return (
                            <line
                                key={i}
                                x1={100 + innerR * Math.cos(rad)}
                                y1={100 + innerR * Math.sin(rad)}
                                x2={100 + outerR * Math.cos(rad)}
                                y2={100 + outerR * Math.sin(rad)}
                                stroke={isActive ? settings.accent_color : 'rgba(255,255,255,0.1)'}
                                strokeWidth={isMajor ? 2.5 : 1}
                                strokeLinecap="round"
                                opacity={isActive ? (isMajor ? 1 : 0.6) : (isMajor ? 0.3 : 0.1)}
                            />
                        );
                    })}

                    {/* Progress arc */}
                    <circle
                        cx="100" cy="100" r="96"
                        fill="none"
                        stroke={settings.accent_color}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${(secondNum / 60) * (2 * Math.PI * 96)} ${2 * Math.PI * 96}`}
                        transform="rotate(-90 100 100)"
                        opacity="0.8"
                        style={{ filter: `drop-shadow(0 0 6px ${settings.accent_color})` }}
                    />

                    {/* Glowing dot at seconds position */}
                    <circle
                        cx={100 + 96 * Math.cos(((secondDeg - 90) * Math.PI) / 180)}
                        cy={100 + 96 * Math.sin(((secondDeg - 90) * Math.PI) / 180)}
                        r="5"
                        fill={settings.accent_color}
                        style={{ filter: `drop-shadow(0 0 8px ${settings.accent_color})` }}
                    >
                        <animate attributeName="r" values="4;7;4" dur="1s" repeatCount="indefinite" />
                    </circle>
                </svg>

                {/* Inner circular background */}
                <div
                    className="absolute rounded-full flex items-center justify-center"
                    style={{
                        width: '82%',
                        height: '82%',
                        background: isLocal
                            ? `radial-gradient(circle, rgba(0,0,0,0.85) 60%, ${settings.accent_color}10 100%)`
                            : 'radial-gradient(circle, rgba(0,0,0,0.8) 60%, rgba(30,30,30,0.6) 100%)',
                        border: isLocal
                            ? `1px solid ${settings.accent_color}30`
                            : '1px solid rgba(255,255,255,0.06)',
                        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)',
                    }}
                />

                {/* Content inside circle */}
                <div className="relative z-10 flex flex-col items-center justify-center">
                    {/* Zone label */}
                    <span style={{ fontSize: '0.5vw' }} className="text-white/20 font-bold tracking-[0.35em] uppercase">
                        {zone.region}
                    </span>
                    <h2
                        style={{ fontSize: labelFontSize, color: isLocal ? settings.accent_color : 'white' }}
                        className="font-black tracking-wider leading-none mt-[0.2vh]"
                    >
                        {zone.label}
                    </h2>

                    {/* Seven Segment Time */}
                    <div className="flex items-center mt-[1vh]">
                        <SevenSegmentDigit digit={hour[0]} size={timeFontSize} color="#ff1a1a" />
                        <SevenSegmentDigit digit={hour[1]} size={timeFontSize} color="#ff1a1a" />
                        <SevenSegmentColon size={timeFontSize} color="#ff1a1a" />
                        <SevenSegmentDigit digit={minute[0]} size={timeFontSize} color="#ff1a1a" />
                        <SevenSegmentDigit digit={minute[1]} size={timeFontSize} color="#ff1a1a" />
                    </div>

                    {ampm && (
                        <span style={{ fontSize: '0.7vw', color: '#ff4444' }} className="font-bold mt-[0.3vh] tracking-[0.2em]">{ampm}</span>
                    )}

                    {/* Seconds display */}
                    <div className="flex items-center gap-[0.3vw] mt-[0.8vh]">
                        <span style={{ fontSize: '0.9vw' }} className="text-white/50 font-black tabular-nums">{second}</span>
                        <span style={{ fontSize: '0.5vw' }} className="text-white/25 font-bold tracking-wider">SEC</span>
                    </div>
                </div>
            </div>

            {/* Info below the circle */}
            <div className="flex flex-col items-center gap-[0.3vh]">
                <div className="flex items-center gap-[0.4vw]">
                    <div className="w-[0.35vw] h-[0.35vw] rounded-full" style={{ background: settings.accent_color }} />
                    <span style={{ fontSize: '0.65vw' }} className="text-white/40 font-bold tracking-[0.1em]">
                        UTC{zone.offset}
                    </span>
                    {isLocal && (
                        <>
                            <span className="text-white/15 mx-[0.2vw]">•</span>
                            <span style={{ fontSize: '0.55vw', color: settings.accent_color }} className="font-bold tracking-[0.15em] uppercase">
                                {localLabel}
                            </span>
                        </>
                    )}
                </div>
                {dateStr && (
                    <span style={{ fontSize: '0.6vw' }} className="text-white/25 font-medium">
                        {dateStr}
                    </span>
                )}
            </div>
        </div>
    );
}

/* â”€â”€â”€ Seven Segment Display Components â”€â”€â”€ */

// Segment map: which segments are ON for each digit (0-9)
// Segments labeled: a(top), b(top-right), c(bottom-right), d(bottom), e(bottom-left), f(top-left), g(middle)
const SEGMENT_MAP: Record<string, boolean[]> = {
    '0': [true,  true,  true,  true,  true,  true,  false],
    '1': [false, true,  true,  false, false, false, false],
    '2': [true,  true,  false, true,  true,  false, true],
    '3': [true,  true,  true,  true,  false, false, true],
    '4': [false, true,  true,  false, false, true,  true],
    '5': [true,  false, true,  true,  false, true,  true],
    '6': [true,  false, true,  true,  true,  true,  true],
    '7': [true,  true,  true,  false, false, false, false],
    '8': [true,  true,  true,  true,  true,  true,  true],
    '9': [true,  true,  true,  true,  false, true,  true],
};

function SevenSegmentDigit({ digit, size, color }: { digit: string; size: string; color: string }) {
    const segments = SEGMENT_MAP[digit] || SEGMENT_MAP['0'];
    const numSize = parseFloat(size);
    const unit = size.replace(/[0-9.]/g, '');

    const w = numSize * 0.65;
    const h = numSize;
    const margin = numSize * 0.04;

    return (
        <svg
            viewBox="0 0 60 100"
            style={{ width: `${w}${unit}`, height: `${h}${unit}`, margin: `0 ${margin}${unit}` }}
            className="block"
        >
            {/* a - top horizontal */}
            <polygon
                points="10,2 50,2 45,12 15,12"
                fill={segments[0] ? color : 'rgba(255,60,60,0.06)'}
                style={{ filter: segments[0] ? `drop-shadow(0 0 6px ${color})` : 'none' }}
            />
            {/* b - top right vertical */}
            <polygon
                points="52,4 52,47 46,42 46,12"
                fill={segments[1] ? color : 'rgba(255,60,60,0.06)'}
                style={{ filter: segments[1] ? `drop-shadow(0 0 6px ${color})` : 'none' }}
            />
            {/* c - bottom right vertical */}
            <polygon
                points="52,53 52,96 46,88 46,58"
                fill={segments[2] ? color : 'rgba(255,60,60,0.06)'}
                style={{ filter: segments[2] ? `drop-shadow(0 0 6px ${color})` : 'none' }}
            />
            {/* d - bottom horizontal */}
            <polygon
                points="10,98 50,98 45,88 15,88"
                fill={segments[3] ? color : 'rgba(255,60,60,0.06)'}
                style={{ filter: segments[3] ? `drop-shadow(0 0 6px ${color})` : 'none' }}
            />
            {/* e - bottom left vertical */}
            <polygon
                points="8,53 8,96 14,88 14,58"
                fill={segments[4] ? color : 'rgba(255,60,60,0.06)'}
                style={{ filter: segments[4] ? `drop-shadow(0 0 6px ${color})` : 'none' }}
            />
            {/* f - top left vertical */}
            <polygon
                points="8,4 8,47 14,42 14,12"
                fill={segments[5] ? color : 'rgba(255,60,60,0.06)'}
                style={{ filter: segments[5] ? `drop-shadow(0 0 6px ${color})` : 'none' }}
            />
            {/* g - middle horizontal */}
            <polygon
                points="12,47 48,47 45,53 15,53"
                fill={segments[6] ? color : 'rgba(255,60,60,0.06)'}
                style={{ filter: segments[6] ? `drop-shadow(0 0 6px ${color})` : 'none' }}
            />
        </svg>
    );
}

function SevenSegmentColon({ size, color }: { size: string; color: string }) {
    const numSize = parseFloat(size);
    const unit = size.replace(/[0-9.]/g, '');
    const w = numSize * 0.28;
    const h = numSize;

    return (
        <svg
            viewBox="0 0 25 100"
            style={{ width: `${w}${unit}`, height: `${h}${unit}` }}
            className="block animate-pulse"
        >
            <circle cx="12.5" cy="33" r="6" fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
            <circle cx="12.5" cy="67" r="6" fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
        </svg>
    );
}
