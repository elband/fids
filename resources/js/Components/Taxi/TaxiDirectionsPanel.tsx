import { useEffect, useState } from 'react';
import { Footprints, MapPin, QrCode, Timer } from 'lucide-react';
import { Lang, TaxiCounter, TaxiDirection, TaxiSettings } from './types';
import { PanelTitle } from './TaxiFlightPanel';
import { pick, t } from './i18n';
import CounterArrow from './CounterArrow';
import FitText from '@/Components/FitText';

interface Props {
    directions: TaxiDirection[];
    counters: TaxiCounter[];
    settings: TaxiSettings;
    lang: Lang;
}

/** Ganti petunjuk tiap sekian detik bila operator memasang lebih dari satu. */
const ROTATE_MS = 18000;

/**
 * Jumlah kolom kartu counter, mengikuti banyaknya counter yang aktif.
 * Sedikit counter → kolom lebih sedikit tetapi barisnya lebih tinggi, sehingga
 * panel selalu terisi penuh dan tidak menyisakan ruang kosong.
 */
function columnsFor(count: number): number {
    if (count <= 2) return 1;
    if (count <= 12) return 2;
    return 3;
}

/**
 * Panel utama layar: kartu counter taksi bergaya papan Boarding Gate
 * (nomor besar + panah arah + operator), dengan strip ringkas berisi denah,
 * jarak, estimasi jalan kaki, dan QR lokasi di bagian bawah.
 */
export default function TaxiDirectionsPanel({ directions, counters, settings, lang }: Props) {
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        if (directions.length < 2) return;
        const timer = setInterval(() => setIdx((i) => (i + 1) % directions.length), ROTATE_MS);
        return () => clearInterval(timer);
    }, [directions.length]);

    // Daftar bisa menyusut setelah refresh data; jaga indeks tetap valid.
    const current = directions[idx] ?? directions[0];
    const accent = settings.warna_aksen;

    const columns = columnsFor(counters.length);
    const sisa = counters.length % columns;
    const lastCardSpan = sisa === 0 ? 1 : columns - sisa + 1;

    return (
        <section className="flex flex-col min-h-0 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <PanelTitle color={accent}>{t('directionsPanel', lang)}</PanelTitle>

            {/* Ajakan utama */}
            <p
                className="px-[1vw] pb-[0.6vmin] font-black leading-tight"
                style={{ color: accent, fontSize: 'clamp(0.7rem, 1.9vmin, 1.7rem)' }}
            >
                {t('callToAction', lang)}
            </p>

            {/* Strip denah / jarak / QR — di atas kartu counter */}
            {current && (
                <div className="mx-[1vw] mb-[0.7vmin] flex items-center gap-[0.8vw] rounded-xl bg-black/30 ring-1 ring-white/10 p-[0.6vmin]">
                    <div className="h-[7vmin] aspect-video rounded-lg overflow-hidden bg-black/50 shrink-0 grid place-items-center">
                        {(current.denah_url ?? current.gambar_url) ? (
                            <img
                                src={(current.denah_url ?? current.gambar_url) as string}
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <MapPin className="h-[3vmin] w-[3vmin] text-white/20" />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-white font-bold truncate"
                           style={{ fontSize: 'clamp(0.6rem, 1.6vmin, 1.3rem)' }}>
                            {pick(current.judul, current.judul_en, lang)}
                        </p>
                        <div className="mt-[0.4vmin] flex flex-wrap items-center gap-[0.6vw]">
                            {current.jarak_meter !== null && (
                                <Metric icon={<Footprints className="h-[1.8vmin] w-[1.8vmin]" />}
                                        label={t('walkDistance', lang)} value={`${current.jarak_meter} m`} accent={accent} />
                            )}
                            {current.estimasi_menit !== null && (
                                <Metric icon={<Timer className="h-[1.8vmin] w-[1.8vmin]" />}
                                        label={t('walkTime', lang)}
                                        value={`${current.estimasi_menit} ${t('minutes', lang)}`} accent={accent} />
                            )}
                        </div>
                    </div>

                    {current.qr_url_gambar && (
                        <div className="text-center shrink-0">
                            <div className="rounded-lg bg-white p-[0.3vmin]">
                                <img src={current.qr_url_gambar} alt="" loading="lazy"
                                     className="h-[6vmin] w-[6vmin] object-contain" />
                            </div>
                            <p className="mt-[0.2vmin] flex items-center justify-center gap-1 text-white/50 font-bold uppercase tracking-[0.1em]"
                               style={{ fontSize: 'clamp(0.4rem, 0.95vmin, 0.75rem)' }}>
                                <QrCode className="h-[1.1vmin] w-[1.1vmin]" />
                                {t('scanQr', lang)}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Kartu counter */}
            {counters.length === 0 ? (
                <div className="flex-1 grid place-items-center text-white/25 font-bold uppercase tracking-[0.25em] text-center px-[1vw]"
                     style={{ fontSize: 'clamp(0.6rem, 1.5vmin, 1.2rem)' }}>
                    {t('noCounters', lang)}
                </div>
            ) : (
                <div
                    className="flex-1 min-h-0 px-[1vw] grid gap-[0.6vmin] overflow-hidden"
                    style={{
                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                        // Baris dibagi rata setinggi area yang tersedia, sehingga
                        // kartu memenuhi panel berapa pun jumlahnya.
                        gridAutoRows: 'minmax(0, 1fr)',
                    }}
                >
                    {counters.map((c, i) => (
                        <CounterCard
                            key={c.id}
                            counter={c}
                            accent={accent}
                            lang={lang}
                            // Jumlah yang tidak habis dibagi kolom menyisakan sel
                            // kosong di baris terakhir; kartu pamungkas dilebarkan
                            // untuk menutupnya.
                            span={i === counters.length - 1 ? lastCardSpan : 1}
                        />
                    ))}
                </div>
            )}

            {directions.length > 1 && (
                <div className="flex justify-center gap-[0.4vw] pb-[0.7vmin]">
                    {directions.map((d, i) => (
                        <span
                            key={d.id}
                            className="h-[0.5vmin] rounded-full transition-all"
                            style={{
                                width: i === idx ? '1.6vw' : '0.5vw',
                                background: i === idx ? accent : 'rgba(255,255,255,0.2)',
                            }}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

/** Kartu satu counter — mengikuti pola papan Boarding Gate: blok nomor + info. */
function CounterCard({
    counter, accent, lang, span = 1,
}: { counter: TaxiCounter; accent: string; lang: Lang; span?: number }) {
    return (
        <div
            className="flex items-stretch rounded-xl overflow-hidden ring-1 ring-white/10 bg-white/[0.05] min-h-0"
            style={span > 1 ? { gridColumn: `span ${span}` } : undefined}
        >
            <div
                className="w-[34%] shrink-0 grid place-content-center text-center bg-black/55 px-[0.4vw] py-[0.5vmin]"
                style={{ borderRight: `1px solid ${accent}33` }}
            >
                <span className="block text-white/40 font-black uppercase tracking-[0.18em] leading-none"
                      style={{ fontSize: 'clamp(0.38rem, 0.9vmin, 0.7rem)' }}>
                    {t('counterLabel', lang)}
                </span>
                {/* Panah mendahului nomor: arah dibaca lebih dulu, baru counternya. */}
                <span className="flex items-center justify-center gap-[0.35vw]">
                    <CounterArrow
                        arah={counter.arah}
                        className="shrink-0 h-[2.8vmin] w-[2.8vmin]"
                        style={{ color: accent }}
                    />
                    <span className="font-black leading-none tabular-nums"
                          style={{ color: accent, fontSize: 'clamp(1.1rem, 3.4vmin, 3rem)' }}>
                        {counter.nomor}
                    </span>
                </span>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center px-[0.8vw] py-[0.5vmin]">
                {/* Nama operator adalah informasi utama kartu: diberi seluruh sisa
                    ruang dan diskalakan mengisi penuh, bukan dipatok lalu dipotong. */}
                <div className="flex-1 min-h-0">
                    <FitText className="text-white font-black" min={12} max={72}>
                        {counter.nama_operator}
                    </FitText>
                </div>
                {counter.jenis_layanan && (
                    <span className="block text-white/50 font-semibold truncate shrink-0"
                          style={{ fontSize: 'clamp(0.5rem, 1.4vmin, 1.15rem)' }}>
                        {counter.jenis_layanan}
                    </span>
                )}
            </div>
        </div>
    );
}

function Metric({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
    return (
        <div className="flex items-center gap-[0.4vw] rounded-lg px-[0.6vw] py-[0.3vmin] bg-white/[0.06] ring-1 ring-white/10">
            <span style={{ color: accent }}>{icon}</span>
            <span>
                <span className="block text-white/45 font-bold uppercase tracking-[0.12em] leading-none"
                      style={{ fontSize: 'clamp(0.4rem, 0.95vmin, 0.75rem)' }}>
                    {label}
                </span>
                <span className="block text-white font-black leading-tight tabular-nums"
                      style={{ fontSize: 'clamp(0.6rem, 1.6vmin, 1.3rem)' }}>
                    {value}
                </span>
            </span>
        </div>
    );
}
