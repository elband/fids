import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import TaxiHeader from '@/Components/Taxi/TaxiHeader';
import TaxiFlightPanel from '@/Components/Taxi/TaxiFlightPanel';
import TaxiDirectionsPanel from '@/Components/Taxi/TaxiDirectionsPanel';
import TaxiVideoPanel from '@/Components/Taxi/TaxiVideoPanel';
import TaxiFarePanel from '@/Components/Taxi/TaxiFarePanel';
import TaxiRunningText from '@/Components/Taxi/TaxiRunningText';
import TaxiEmergencyOverlay from '@/Components/Taxi/TaxiEmergencyOverlay';
import { themeOf } from '@/Components/Taxi/theme';
import { Lang, TaxiPayload } from '@/Components/Taxi/types';
import { reportVideoPlayed, useScreenHeartbeat, useTaxiFeed } from '@/hooks/useTaxiFeed';

interface Props {
    initial: TaxiPayload;
    screenCode: string;
}

/**
 * Layar "Taxi Information & Digital Signage".
 *
 * Dirancang untuk kiosk 24/7 pada TV 43"–55" dan LED: seluruh ukuran memakai
 * satuan viewport sehingga tata letaknya identik dari Full HD sampai 4K tanpa
 * pernah menggulir. Data disegarkan lewat polling (tanpa reload halaman) dan
 * tetap menampilkan konten terakhir saat koneksi terputus.
 */
export default function TaxiSignage({ initial, screenCode }: Props) {
    const { data, online } = useTaxiFeed(initial);
    useScreenHeartbeat(screenCode);

    const { settings, emergency } = data;
    const lang = useDisplayLanguage(settings.bahasa, settings.bahasa_switch_detik);
    const now = useClock();
    const theme = useMemo(() => themeOf(settings.tema_warna), [settings.tema_warna]);

    const showFlights = settings.tampilkan_penerbangan;
    const showVideo = settings.tampilkan_video;
    const showFares = settings.tampilkan_tarif;

    const portrait = useIsPortrait();

    // Lanskap: video jadi pita atas, tiga panel berjajar di baris bawah.
    // Potret (TV 55" berdiri): semuanya ditumpuk satu kolom karena lebar layar
    // tidak cukup untuk tiga panel bersebelahan.
    const bottomCols = [
        'minmax(0,5fr)',
        showFlights ? 'minmax(0,4fr)' : null,
        showFares ? 'minmax(0,3fr)' : null,
    ].filter(Boolean).join(' ');

    // Proporsi baris potret. Porsi video dibuat mendekati 16:9 terhadap lebar
    // layar supaya nyaris tanpa bilah hitam.
    const portraitRows = [
        showVideo ? 'minmax(0,7fr)' : null,
        'minmax(0,6fr)',
        // Jadwal & tarif diberi porsi kecil yang sama besar; kelebihan barisnya
        // ditangani gulir otomatis, jadi sisa ruang untuk video & counter.
        showFlights ? 'minmax(0,2.5fr)' : null,
        showFares ? 'minmax(0,2.5fr)' : null,
    ].filter(Boolean).join(' ');

    return (
        <div
            className="fixed inset-0 flex flex-col overflow-hidden text-white select-none"
            style={{ background: theme.base }}
        >
            <Head title="Taxi Information" />

            {settings.background_url && (
                <div
                    aria-hidden
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{ backgroundImage: `url(${settings.background_url})` }}
                />
            )}
            {!settings.mode_hemat && (
                <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: `radial-gradient(circle at 20% 0%, ${theme.glow}, transparent 55%)` }}
                />
            )}

            <div className="relative flex flex-col h-full">
                <TaxiHeader settings={settings} now={now} lang={lang} online={online} />

                <main
                    className="flex-1 min-h-0 grid gap-[0.9vmin] p-[0.9vmin_1.4vmin]"
                    style={{
                        gridTemplateRows: portrait
                            ? portraitRows
                            : (showVideo ? 'minmax(0,4fr) minmax(0,6fr)' : 'minmax(0,1fr)'),
                    }}
                >
                    {/* Video: pita lebar di lanskap (rasio jauh dari 16:9 → tampil utuh),
                        blok mendekati 16:9 di potret (→ boleh mengisi penuh). */}
                    {showVideo && (
                        <TaxiVideoPanel
                            videos={data.videos}
                            settings={settings}
                            lang={lang}
                            onPlayed={reportVideoPlayed}
                            fit={portrait ? 'cover' : 'contain'}
                        />
                    )}

                    {portrait ? (
                        <>
                            <TaxiDirectionsPanel directions={data.directions} counters={data.counters} settings={settings} lang={lang} />
                            {/* Potret memberi lebar penuh, jadi tabel jadwal tampil lengkap.
                                Kelebihan baris ditangani gulir otomatis di dalam panel. */}
                            {showFlights && (
                                <TaxiFlightPanel flights={data.flights} settings={settings} lang={lang} />
                            )}
                            {showFares && (
                                <TaxiFarePanel fares={data.fares} settings={settings} lang={lang} />
                            )}
                        </>
                    ) : (
                        <div className="grid min-h-0 gap-[1vw]" style={{ gridTemplateColumns: bottomCols }}>
                            <TaxiDirectionsPanel directions={data.directions} counters={data.counters} settings={settings} lang={lang} />
                            {showFlights && (
                                <TaxiFlightPanel
                                    flights={data.flights}
                                    settings={settings}
                                    lang={lang}
                                    variant="compact"
                                />
                            )}
                            {showFares && (
                                <TaxiFarePanel fares={data.fares} settings={settings} lang={lang} />
                            )}
                        </div>
                    )}
                </main>

                <TaxiRunningText texts={data.running_texts} settings={settings} lang={lang} />
            </div>

            {emergency && (
                <TaxiEmergencyOverlay emergency={emergency} settings={settings} now={now} lang={lang} />
            )}
        </div>
    );
}

/**
 * Orientasi layar. Dipantau lewat matchMedia agar layar yang diputar
 * (mis. TV 55" dipasang berdiri) langsung memakai tata letak yang benar
 * tanpa perlu reload atau pengaturan tambahan.
 */
function useIsPortrait(): boolean {
    const [portrait, setPortrait] = useState(
        () => typeof window !== 'undefined' && window.matchMedia('(orientation: portrait)').matches,
    );

    useEffect(() => {
        const mq = window.matchMedia('(orientation: portrait)');
        const onChange = (e: MediaQueryListEvent) => setPortrait(e.matches);
        setPortrait(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    return portrait;
}

/** Jam layar; hanya perlu presisi detik, jadi tik sederhana sudah cukup. */
function useClock(): Date {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return now;
}

/** Mode 'auto' menukar bahasa secara berkala; 'id'/'en' mengunci satu bahasa. */
function useDisplayLanguage(mode: 'id' | 'en' | 'auto', switchSeconds: number): Lang {
    const [lang, setLang] = useState<Lang>(mode === 'en' ? 'en' : 'id');

    useEffect(() => {
        if (mode !== 'auto') {
            setLang(mode);
            return;
        }
        const timer = setInterval(
            () => setLang((l) => (l === 'id' ? 'en' : 'id')),
            Math.max(5, switchSeconds) * 1000,
        );
        return () => clearInterval(timer);
    }, [mode, switchSeconds]);

    return lang;
}
