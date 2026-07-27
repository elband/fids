import { PlaneLanding, PlaneTakeoff } from 'lucide-react';
import { Lang, TaxiFlight, TaxiSettings } from './types';
import { statusStyle } from './theme';
import { t } from './i18n';
import TaxiAutoScroll from './TaxiAutoScroll';

interface Props {
    flights: TaxiFlight[];
    settings: TaxiSettings;
    lang: Lang;
    /**
     * 'wide'    — panel selebar layar: seluruh kolom ditampilkan.
     * 'compact' — panel dalam satu kolom sempit: nama maskapai diringkas jadi
     *             logo saja, jadwal & estimasi digabung dalam satu sel.
     */
    variant?: 'wide' | 'compact';
}

/**
 * Panel jadwal penerbangan realtime. Membaca data modul FIDS apa adanya —
 * tidak pernah membuat atau mengubah data penerbangan.
 *
 * Bila daftarnya lebih panjang daripada tinggi panel, isinya bergulir ke atas
 * terus-menerus sehingga seluruh penerbangan tetap terbaca.
 */
export default function TaxiFlightPanel({ flights, settings, lang, variant = 'wide' }: Props) {
    const compact = variant === 'compact';

    const cols = compact
        ? 'grid grid-cols-[1.3fr_1.6fr_1fr_0.6fr_1.2fr] gap-[0.5vw] items-center'
        : 'grid grid-cols-[1.1fr_1.5fr_2fr_0.9fr_0.9fr_0.7fr_1.5fr] gap-[0.8vw] items-center';

    const pad = compact ? 'px-[0.8vw]' : 'px-[1.2vw]';
    const headStyle = { fontSize: compact ? 'clamp(0.42rem, 0.95vmin, 0.8rem)' : 'clamp(0.5rem, 1.15vmin, 0.95rem)' };
    const cellStyle = { fontSize: compact ? 'clamp(0.55rem, 1.45vmin, 1.2rem)' : 'clamp(0.7rem, 1.85vmin, 1.6rem)' };

    return (
        <section className="flex flex-col min-h-0 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <PanelTitle color={settings.warna_aksen}>{t('flightPanel', lang)}</PanelTitle>

            <div
                className={`${cols} ${pad} py-[0.7vmin] bg-black/40 border-y border-white/10 font-black uppercase tracking-[0.16em] text-white/50`}
                style={headStyle}
            >
                <span>{t('flight', lang)}</span>
                {!compact && <span>{t('airline', lang)}</span>}
                <span>{t('fromTo', lang)}</span>
                <span className="text-center">{t('sched', lang)}</span>
                {!compact && <span className="text-center">{t('est', lang)}</span>}
                <span className="text-center">{t('gate', lang)}</span>
                <span className="text-right">{t('status', lang)}</span>
            </div>

            {flights.length === 0 ? (
                <div className="flex-1 grid place-items-center text-white/25 font-bold uppercase tracking-[0.3em] text-center px-[1vw]"
                     style={{ fontSize: compact ? 'clamp(0.55rem, 1.4vmin, 1.1rem)' : 'clamp(0.7rem, 1.8vmin, 1.4rem)' }}>
                    {t('noFlights', lang)}
                </div>
            ) : (
                <TaxiAutoScroll className="flex-1 min-h-0" secondsPerScreen={settings.scroll_detik_per_layar}>
                  <div className="divide-y divide-white/5">
                    {flights.map((f) => {
                        const s = statusStyle(f.status);
                        const delayed = f.jam_estimasi && f.jam_estimasi !== f.jam_jadwal;

                        return (
                            <div key={f.id} className={`${cols} ${pad} py-[0.62vmin]`} style={cellStyle}>
                                <span className="flex items-center gap-[0.4vw] min-w-0">
                                    {/* Mode ringkas: logo menggantikan kolom nama maskapai. */}
                                    {compact && f.airline_logo && (
                                        <img src={f.airline_logo} alt="" loading="lazy"
                                             className="h-[1.8vmin] w-auto object-contain shrink-0" />
                                    )}
                                    <span className="font-black text-white tabular-nums tracking-wide truncate">
                                        {f.nomor_penerbangan}
                                    </span>
                                </span>

                                {!compact && (
                                    <span className="flex items-center gap-[0.5vw] min-w-0 text-white/85 font-semibold truncate">
                                        {f.airline_logo && (
                                            <img src={f.airline_logo} alt="" loading="lazy"
                                                 className="h-[2.2vmin] w-auto object-contain shrink-0" />
                                        )}
                                        <span className="truncate">{f.airline ?? '—'}</span>
                                    </span>
                                )}

                                <span className="flex items-center gap-[0.4vw] min-w-0 text-white font-bold truncate">
                                    {f.jenis === 'arrival'
                                        ? <PlaneLanding className="h-[1.8vmin] w-[1.8vmin] shrink-0 text-sky-300" />
                                        : <PlaneTakeoff className="h-[1.8vmin] w-[1.8vmin] shrink-0 text-amber-300" />}
                                    <span className="truncate">{f.kota ?? '—'}</span>
                                </span>

                                {compact ? (
                                    /* Jadwal & estimasi ditumpuk agar hemat lebar kolom. */
                                    <span className="text-center leading-tight">
                                        <span className={`block tabular-nums font-bold ${delayed ? 'text-white/40 line-through' : 'text-white'}`}>
                                            {f.jam_jadwal ?? '—'}
                                        </span>
                                        {delayed && (
                                            <span className="block tabular-nums font-black" style={{ color: '#fbbf24' }}>
                                                {f.jam_estimasi}
                                            </span>
                                        )}
                                    </span>
                                ) : (
                                    <>
                                        <span className={`text-center tabular-nums font-bold ${delayed ? 'text-white/40 line-through' : 'text-white'}`}>
                                            {f.jam_jadwal ?? '—'}
                                        </span>
                                        <span className="text-center tabular-nums font-black"
                                              style={{ color: delayed ? '#fbbf24' : 'rgba(255,255,255,0.45)' }}>
                                            {f.jam_estimasi ?? '—'}
                                        </span>
                                    </>
                                )}

                                <span className="text-center font-black text-white tabular-nums">
                                    {f.gate ?? '—'}
                                </span>

                                <span className="flex justify-end">
                                    <span
                                        className={`px-[0.5vw] py-[0.3vmin] rounded-full font-black uppercase tracking-[0.1em] whitespace-nowrap truncate ${
                                            s.pulse && !settings.mode_hemat ? 'animate-pulse' : ''
                                        }`}
                                        style={{
                                            color: s.text,
                                            background: s.bg,
                                            boxShadow: `inset 0 0 0 1px ${s.ring}`,
                                            fontSize: compact ? 'clamp(0.42rem, 1.1vmin, 0.9rem)' : 'clamp(0.55rem, 1.45vmin, 1.2rem)',
                                        }}
                                    >
                                        {f.status ?? '—'}
                                    </span>
                                </span>
                            </div>
                        );
                    })}
                  </div>
                </TaxiAutoScroll>
            )}
        </section>
    );
}

export function PanelTitle({ children, color }: { children: React.ReactNode; color: string }) {
    return (
        <h2
            className="px-[1.2vw] py-[0.65vmin] font-black uppercase tracking-[0.24em] flex items-center gap-[0.6vw]"
            style={{ color, fontSize: 'clamp(0.6rem, 1.5vmin, 1.2rem)' }}
        >
            <span className="inline-block h-[1.4vmin] w-[0.25vw] rounded-full" style={{ background: color }} />
            {children}
        </h2>
    );
}
