import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AdSlide, { AdItem } from '@/Components/AdSlide';

interface Props {
    ads: AdItem[];
}

export default function AdvertisementDisplay({ ads }: Props) {
    const [idx, setIdx] = useState(0);

    // Auto reload data every 2 minutes to sync with admin changes
    useEffect(() => {
        const reloadTimer = setInterval(() => {
            router.reload({ only: ['ads'] });
        }, 120000);
        return () => clearInterval(reloadTimer);
    }, []);

    if (ads.length === 0) {
        return (
            <div className="h-screen w-full bg-black flex items-center justify-center text-white/20 font-bold text-4xl uppercase tracking-widest">
                <Head title="Advertisement Monitor" />
                No Advertisements Active
            </div>
        );
    }

    const current = ads[idx] ?? ads[0];

    return (
        <div className="h-screen w-full bg-black overflow-hidden relative">
            <Head title="Advertisement Monitor" />

            <AdSlide
                ads={ads}
                fitClass="object-cover"
                transition="auto"
                transitionMs={1000}
                onIndexChange={setIdx}
                showProgress={true}
                overlay={
                    <div className="absolute top-6 right-6 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/80 text-xs font-bold tracking-widest uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)] animate-pulse"></span>
                        Iklan {idx + 1} / {ads.length}
                    </div>
                }
            />

            {/* Optional title strip */}
            {current.title && (
                <div className="absolute bottom-6 left-6 z-10 max-w-[60%] bg-black/55 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
                    <p className="text-white font-bold text-2xl tracking-tight drop-shadow">{current.title}</p>
                </div>
            )}
        </div>
    );
}
