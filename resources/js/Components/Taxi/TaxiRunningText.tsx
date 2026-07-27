import { useMemo } from 'react';
import { Info } from 'lucide-react';
import { Lang, TaxiRunningTextItem, TaxiSettings } from './types';
import { pick } from './i18n';

interface Props {
    texts: TaxiRunningTextItem[];
    settings: TaxiSettings;
    lang: Lang;
}

/**
 * Running text bawah layar. Seluruh pesan digabung menjadi satu pita yang
 * bergerak, digandakan dua kali supaya perputarannya mulus tanpa jeda kosong.
 */
export default function TaxiRunningText({ texts, settings, lang }: Props) {
    const items = useMemo(
        () => texts.map((tx) => ({ id: tx.id, warna: tx.warna, teks: pick(tx.pesan, tx.pesan_en, lang) })),
        [texts, lang],
    );

    if (items.length === 0) return null;

    const strip = (keySuffix: string) => (
        <span className="flex items-center shrink-0" aria-hidden={keySuffix === 'b'}>
            {items.map((item) => (
                <span key={`${item.id}-${keySuffix}`} className="flex items-center whitespace-nowrap">
                    <span
                        className="mx-[1.6vw] font-bold"
                        style={{ color: item.warna, fontSize: 'clamp(0.75rem, 2.1vmin, 1.8rem)' }}
                    >
                        {item.teks}
                    </span>
                    <span className="h-[1vmin] w-[1vmin] rounded-full bg-white/25" />
                </span>
            ))}
        </span>
    );

    return (
        <footer className="flex items-stretch border-t border-white/10 bg-black/45 overflow-hidden">
            <div
                className="flex items-center gap-[0.5vw] px-[1.2vw] font-black uppercase tracking-[0.22em] shrink-0"
                style={{ background: settings.warna_aksen, color: '#0b1120', fontSize: 'clamp(0.55rem, 1.4vmin, 1.1rem)' }}
            >
                <Info className="h-[1.8vmin] w-[1.8vmin]" />
                INFO
            </div>

            <div className="relative flex-1 overflow-hidden py-[0.7vmin]">
                <div
                    className="flex w-max taxi-marquee"
                    // Marquee tetap berjalan di mode hemat — ini konten, bukan hiasan.
                    // Yang dimatikan mode hemat adalah efek berat (blur, pulse, bob).
                    style={{ animationDuration: `${settings.running_text_speed}s` }}
                >
                    {strip('a')}
                    {strip('b')}
                </div>
            </div>
        </footer>
    );
}
