import { useMemo } from 'react';
import { Lang, TaxiFare, TaxiSettings } from './types';
import { PanelTitle } from './TaxiFlightPanel';
import { formatRupiah, t } from './i18n';
import TaxiAutoScroll from './TaxiAutoScroll';

interface Props {
    fares: TaxiFare[];
    settings: TaxiSettings;
    lang: Lang;
}

/**
 * Panel tarif resmi, dikelompokkan per wilayah. Bila daftarnya lebih panjang
 * daripada tinggi panel, isinya bergulir ke atas terus-menerus.
 */
export default function TaxiFarePanel({ fares, settings, lang }: Props) {
    // Kelompokkan per wilayah, lalu ratakan jadi daftar berlabel supaya
    // judul wilayahnya ikut mengalir bersama barisnya.
    const rows = useMemo(() => {
        const byRegion = new Map<string, TaxiFare[]>();
        fares.forEach((f) => {
            const list = byRegion.get(f.wilayah) ?? [];
            list.push(f);
            byRegion.set(f.wilayah, list);
        });
        return [...byRegion.entries()].flatMap(([wilayah, items]) => [
            { kind: 'header' as const, key: `h-${wilayah}`, wilayah },
            ...items.map((f) => ({ kind: 'fare' as const, key: `f-${f.id}`, fare: f })),
        ]);
    }, [fares]);

    const accent = settings.warna_aksen;

    return (
        <section className="flex flex-col min-h-0 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <PanelTitle color={accent}>{t('farePanel', lang)}</PanelTitle>

            {rows.length === 0 ? (
                <div className="flex-1 grid place-items-center text-white/25 font-bold uppercase tracking-[0.25em] text-center px-[1vw]"
                     style={{ fontSize: 'clamp(0.6rem, 1.5vmin, 1.2rem)' }}>
                    {t('noFares', lang)}
                </div>
            ) : (
                // Padding horizontal dipasang di tiap baris, bukan di wadah,
                // supaya lebar barisnya persis sama dengan panel jadwal.
                <TaxiAutoScroll className="flex-1 min-h-0 pb-[0.5vmin]" secondsPerScreen={settings.scroll_detik_per_layar}>
                  <div className="space-y-[0.4vmin]">
                    {rows.map((row) =>
                        row.kind === 'header' ? (
                            <div
                                key={row.key}
                                className="px-[1.2vw] pt-[0.6vmin] font-black uppercase tracking-[0.22em] text-white/40"
                                style={{ fontSize: 'clamp(0.5rem, 1.15vmin, 0.95rem)' }}
                            >
                                {row.wilayah}
                            </div>
                        ) : (
                            <FareRow key={row.key} fare={row.fare} accent={accent} lang={lang} />
                        )
                    )}
                  </div>
                </TaxiAutoScroll>
            )}
        </section>
    );
}

function FareRow({ fare, accent, lang }: { fare: TaxiFare; accent: string; lang: Lang }) {
    return (
        <div
            className="flex items-center justify-between gap-[0.6vw] px-[1.2vw] py-[0.5vmin]"
            style={{ background: fare.baru ? `${accent}1f` : 'rgba(255,255,255,0.04)' }}
        >
            <span className="min-w-0">
                <span className="flex items-center gap-[0.4vw]">
                    <span className="block text-white font-bold truncate"
                          style={{ fontSize: 'clamp(0.65rem, 1.7vmin, 1.4rem)' }}>
                        {fare.tujuan}
                    </span>
                    {fare.baru && (
                        <span
                            className="shrink-0 px-[0.4vw] py-[0.1vmin] rounded font-black tracking-[0.14em]"
                            style={{ background: accent, color: '#0b1120', fontSize: 'clamp(0.4rem, 0.95vmin, 0.75rem)' }}
                        >
                            {t('newFare', lang)}
                        </span>
                    )}
                </span>
                <span className="block text-white/45 font-semibold truncate"
                      style={{ fontSize: 'clamp(0.45rem, 1.1vmin, 0.9rem)' }}>
                    {fare.jenis_kendaraan}
                </span>
            </span>

            <span className="text-right shrink-0">
                {fare.baru && fare.tarif_sebelumnya !== null && (
                    <span className="block text-white/35 line-through tabular-nums"
                          style={{ fontSize: 'clamp(0.45rem, 1.05vmin, 0.85rem)' }}>
                        {formatRupiah(fare.tarif_sebelumnya)}
                    </span>
                )}
                <span className="block font-black tabular-nums leading-tight"
                      style={{ color: fare.baru ? accent : '#ffffff', fontSize: 'clamp(0.7rem, 1.9vmin, 1.6rem)' }}>
                    {formatRupiah(fare.tarif)}
                </span>
            </span>
        </div>
    );
}
