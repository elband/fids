import { AlertTriangle } from 'lucide-react';
import { Lang, TaxiEmergency, TaxiSettings } from './types';

interface Props {
    emergency: TaxiEmergency;
    settings: TaxiSettings;
    now: Date;
    lang: Lang;
}

/**
 * Emergency override — menutupi seluruh konten layar. Dipakai operator untuk
 * pengumuman mendesak (perpindahan counter, gangguan operasional).
 */
export default function TaxiEmergencyOverlay({ emergency, settings, now, lang }: Props) {
    const jam = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-[3vmin] px-[6vw] text-center bg-[#2a0606]">
            <div
                aria-hidden
                className={`absolute inset-0 ${settings.mode_hemat ? '' : 'animate-pulse'}`}
                style={{ background: 'radial-gradient(circle at 50% 40%, rgba(239,68,68,0.35), transparent 65%)' }}
            />

            {/* Ikon dipisah dari judul agar judul panjang tetap rata tengah
                dan tidak mendorong ikon ke tepi layar. */}
            <AlertTriangle className="relative h-[9vmin] w-[9vmin] text-amber-300 shrink-0" />

            <h1
                className="relative max-w-[85vw] font-black tracking-[0.08em] text-amber-300 leading-[1.05] text-balance"
                style={{ fontSize: 'clamp(1.6rem, 7vmin, 7rem)' }}
            >
                {emergency.judul}
            </h1>

            {emergency.pesan && (
                <p
                    className="relative max-w-[80vw] font-bold text-white leading-snug whitespace-pre-line line-clamp-6"
                    style={{ fontSize: 'clamp(1.1rem, 4.2vmin, 4rem)' }}
                >
                    {emergency.pesan}
                </p>
            )}

            <p
                className="relative font-bold uppercase tracking-[0.35em] text-white/50 tabular-nums"
                style={{ fontSize: 'clamp(0.7rem, 2vmin, 1.8rem)' }}
            >
                {lang === 'en' ? 'Airport Information' : 'Informasi Bandara'} · {jam}
            </p>
        </div>
    );
}
