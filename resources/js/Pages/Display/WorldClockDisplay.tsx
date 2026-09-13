import { useEffect, useState, useCallback } from 'react';
import '@/../css/amc-clock.css';
import '@/../css/world-clock.css';
import FidsLayout from '@/Layouts/FidsLayout';
import { useNtpClock } from '@/hooks/useNtpClock';
import { getNtpStatus } from '@/lib/timezoneClock';
import { Clock } from 'lucide-react';

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

/**
 * Formatter di-cache per timezone: konstruksi Intl.DateTimeFormat mahal dan
 * halaman ini tick tiap 200ms untuk 4 zona.
 */
const partsFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getPartsFormatter(timezone: string): Intl.DateTimeFormat {
    let fmt = partsFormatterCache.get(timezone);
    if (!fmt) {
        fmt = new Intl.DateTimeFormat('en-GB', {
            timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        });
        partsFormatterCache.set(timezone, fmt);
    }
    return fmt;
}

function getTimeParts(date: Date, timezone: string, format: '12h' | '24h') {
    // Satu formatter berisi hour+minute+second. Jangan dipecah jadi tiga
    // formatter satu-field: bila hanya satu field waktu diminta, `2-digit`
    // diabaikan mesin Intl dan hasilnya "3" bukan "03" — digit kedua jadi
    // undefined lalu jatuh ke '0', sehingga menit 01 tampil "10".
    const parts = getPartsFormatter(timezone).formatToParts(date);
    const pick = (type: string) => (parts.find((p) => p.type === type)?.value ?? '0').padStart(2, '0');

    const h = pick('hour');
    const m = pick('minute');
    const s = pick('second');

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
    const [background, setBackground] = useState<string | null>(null);
    const { now } = useNtpClock();
    const [ntpSynced, setNtpSynced] = useState(false);

    const fetchSettings = useCallback(async () => {
        await Promise.allSettled([
            (async () => {
                const res = await fetch('/api/fids/world-clock-settings');
                if (res.ok) setSettings((await res.json()).data);
            })(),
            (async () => {
                const res = await fetch('/api/fids/settings');
                if (res.ok) setBackground((await res.json()).data?.background_header || null);
            })(),
        ]);
    }, []);

    useEffect(() => {
        fetchSettings();
        const interval = setInterval(fetchSettings, 30_000);
        return () => clearInterval(interval);
    }, [fetchSettings]);

    useEffect(() => {
        const checkStatus = () => setNtpSynced(getNtpStatus() === 'synced');
        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const lang = settings?.bahasa ?? 'id';
    const enabled = ZONES.filter(zone => settings ? settings[zone.key] : true);
    const hero = enabled.find(zone => zone.id === 'wita') ?? enabled[0];
    const satellites = ['wib', 'wit', 'utc', 'wita']
        .map(id => enabled.find(zone => zone.id === id))
        .filter((zone): zone is ZoneConfig => !!zone && zone !== hero);
    const showDate = settings?.show_date ?? true;
    const title = settings?.judul_layar || 'MASTER CLOCK';
    const airport = settings?.nama_bandara || 'APT PRANOTO AAP SAMARINDA';
    const time = (zone: ZoneConfig) => {
        const parts = getTimeParts(now, zone.timezone, settings?.format_waktu ?? '24h');
        return <>
            <span>{parts.hour}:{parts.minute}{(settings?.show_seconds ?? true) ? `:${parts.second}` : ''}</span>
            {parts.ampm && <span className="world-clock-period">{parts.ampm}</span>}
        </>;
    };

    return (
        <FidsLayout title={title}>
            <div className="amc-display world-clock-display font-sans text-white">
                {background && <img className="world-clock-background" src={background} alt="" />}
                {background && <div className="world-clock-shade" aria-hidden="true" />}
                <header className="amc-header world-clock-header">
                    <div className="amc-brand flex min-w-0">
                        <h1>{(settings?.show_nama_bandara ?? true) ? airport : title}</h1>
                        {(settings?.show_nama_bandara ?? true) && <span>{title}</span>}
                    </div>
                    {(settings?.show_ntp_status ?? true) && (
                        <div className={`world-clock-sync ${ntpSynced ? 'is-synced' : ''}`}>
                            <span aria-hidden="true" />
                            {ntpSynced
                                ? (lang === 'id' ? 'WAKTU TERSINKRON' : 'TIME SYNCED')
                                : (lang === 'id' ? 'SINKRON TERTUNDA' : 'SYNC PENDING')}
                        </div>
                    )}
                </header>

                <main className="world-clock-content">
                    {hero ? (
                        <>
                            <section className="world-clock-primary" aria-label={hero.label}>
                                <div className="world-clock-eyebrow">
                                    {hero.sub[lang]} <span className="amc-timezone">{hero.label}</span>
                                </div>
                                <div className="amc-local-digits">{time(hero)}</div>
                                {showDate && <div className="world-clock-date">{formatDateLong(now, hero.timezone, lang)}</div>}
                                <div className="world-clock-offset">{hero.timezone} <span>&middot;</span> {hero.offset}</div>
                            </section>
                            {satellites.length > 0 && (
                                <div className="amc-zone-list" style={{ gridTemplateColumns: `repeat(${satellites.length}, minmax(0, 1fr))` }}>
                                    {satellites.map(zone => (
                                        <section className={`amc-zone-card amc-zone-${zone.id}`} key={zone.id} aria-label={zone.label}>
                                            <div className="amc-zone-info">
                                                <div className="amc-zone-title">
                                                    <div className="world-clock-zone-label"><Clock aria-hidden="true" strokeWidth={1.6} />{zone.label}</div>
                                                    <span>{zone.offset}</span>
                                                </div>
                                                <div className="amc-zone-city">{zone.sub[lang]}</div>
                                            </div>
                                            <div className="amc-zone-value">
                                                <div className="amc-zone-digits">{time(zone)}</div>
                                                {showDate && <div className="amc-zone-date">{new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', {
                                                    timeZone: zone.timezone, day: '2-digit', month: 'short', year: 'numeric',
                                                }).format(now)}</div>}
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : <p className="world-clock-empty">{lang === 'id' ? 'Belum ada zona waktu yang diaktifkan.' : 'No time zones enabled.'}</p>}
                </main>
            </div>
        </FidsLayout>
    );
}
