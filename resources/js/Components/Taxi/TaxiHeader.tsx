import { Car, Wifi, WifiOff } from 'lucide-react';
import { Lang, TaxiSettings } from './types';
import { t } from './i18n';

interface Props {
    settings: TaxiSettings;
    now: Date;
    lang: Lang;
    /** false saat payload terakhir berasal dari cache luring. */
    online: boolean;
}

const DATE_FMT: Record<Lang, string> = { id: 'id-ID', en: 'en-GB' };

export default function TaxiHeader({ settings, now, lang, online }: Props) {
    const jam = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    const detik = now.toLocaleTimeString('en-GB', { second: '2-digit' });
    const tanggal = now.toLocaleDateString(DATE_FMT[lang], {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    return (
        <header className="flex items-center justify-between gap-6 px-[1.6vw] py-[0.9vmin] border-b border-white/10 bg-black/25 backdrop-blur-sm">
            <div className="flex items-center gap-[1.2vw] min-w-0">
                {settings.logo_url ? (
                    <img
                        src={settings.logo_url}
                        alt=""
                        className="h-[6vmin] w-auto object-contain drop-shadow"
                    />
                ) : (
                    <div
                        className="h-[6vmin] aspect-square rounded-2xl grid place-items-center"
                        style={{ background: `${settings.warna_aksen}22`, color: settings.warna_aksen }}
                    >
                        <Car className="h-[3.4vmin] w-[3.4vmin]" />
                    </div>
                )}
                <div className="min-w-0">
                    <h1
                        className="font-black tracking-[0.14em] leading-none truncate"
                        style={{ fontSize: 'clamp(1.4rem, 3.1vmin, 3rem)', color: settings.warna_aksen }}
                    >
                        {settings.judul_layar}
                    </h1>
                    <p className="mt-[0.4vmin] text-white/55 font-semibold tracking-[0.3em] uppercase"
                       style={{ fontSize: 'clamp(0.55rem, 1.25vmin, 1rem)' }}>
                        {t('headerSubtitle', lang)}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-[1.6vw] shrink-0">
                <div
                    className={`flex items-center gap-2 rounded-full px-[0.9vw] py-[0.5vmin] font-bold uppercase tracking-[0.2em] border ${
                        online
                            ? 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10'
                            : 'text-amber-300 border-amber-400/40 bg-amber-400/10'
                    }`}
                    style={{ fontSize: 'clamp(0.5rem, 1.15vmin, 0.9rem)' }}
                >
                    {online ? <Wifi className="h-[1.6vmin] w-[1.6vmin]" /> : <WifiOff className="h-[1.6vmin] w-[1.6vmin]" />}
                    {online ? t('online', lang) : t('updating', lang)}
                </div>

                <div className="text-right leading-none">
                    <div className="flex items-baseline justify-end gap-[0.4vw] tabular-nums">
                        <span className="font-black text-white tracking-tight"
                              style={{ fontSize: 'clamp(1.8rem, 5.4vmin, 5rem)' }}>
                            {jam}
                        </span>
                        <span className="font-bold tabular-nums" style={{ fontSize: 'clamp(0.8rem, 2.2vmin, 2rem)', color: settings.warna_aksen }}>
                            {detik}
                        </span>
                    </div>
                    <div className="mt-[0.5vmin] text-white/70 font-semibold uppercase tracking-[0.18em]"
                         style={{ fontSize: 'clamp(0.55rem, 1.35vmin, 1.1rem)' }}>
                        {tanggal}
                    </div>
                </div>
            </div>
        </header>
    );
}
