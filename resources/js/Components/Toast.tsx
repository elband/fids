import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { type PageProps } from '@/types';
import { CheckCircle2, AlertTriangle, Info, XCircle, X, type LucideIcon } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
    id: number;
    type: ToastType;
    message: string;
    createdAt: number;
}

interface FlashShape {
    success?: string | null;
    error?: string | null;
    warning?: string | null;
    info?: string | null;
}

const PALETTE: Record<ToastType, {
    icon: LucideIcon;
    iconBg: string;
    accent: string;
    glow: string;
    border: string;
    progress: string;
}> = {
    success: {
        icon: CheckCircle2,
        iconBg: 'bg-emerald-500',
        accent: 'from-emerald-400 via-teal-400 to-cyan-400',
        glow: 'shadow-[0_8px_40px_-12px_rgba(16,185,129,0.55)]',
        border: 'ring-emerald-300/30',
        progress: 'from-emerald-400 to-cyan-400',
    },
    error: {
        icon: XCircle,
        iconBg: 'bg-rose-500',
        accent: 'from-rose-400 via-pink-400 to-fuchsia-400',
        glow: 'shadow-[0_8px_40px_-12px_rgba(244,63,94,0.55)]',
        border: 'ring-rose-300/30',
        progress: 'from-rose-400 to-fuchsia-400',
    },
    warning: {
        icon: AlertTriangle,
        iconBg: 'bg-amber-500',
        accent: 'from-amber-400 via-orange-400 to-rose-400',
        glow: 'shadow-[0_8px_40px_-12px_rgba(245,158,11,0.55)]',
        border: 'ring-amber-300/30',
        progress: 'from-amber-400 to-rose-400',
    },
    info: {
        icon: Info,
        iconBg: 'bg-sky-500',
        accent: 'from-sky-400 via-indigo-400 to-violet-400',
        glow: 'shadow-[0_8px_40px_-12px_rgba(56,189,248,0.55)]',
        border: 'ring-sky-300/30',
        progress: 'from-sky-400 to-violet-400',
    },
};

const DURATION_MS = 4500;

export default function ToastViewport() {
    const page = usePage<PageProps<{ flash?: FlashShape }>>();
    const flash = page.props.flash ?? {};
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    // Watch flash messages and push to toast queue
    useEffect(() => {
        const items: ToastItem[] = [];
        const make = (type: ToastType, msg?: string | null) => {
            if (!msg) return;
            items.push({ id: Date.now() + Math.random(), type, message: msg, createdAt: Date.now() });
        };
        make('success', flash.success);
        make('error',   flash.error);
        make('warning', flash.warning);
        make('info',    flash.info);
        if (items.length > 0) {
            setToasts((prev) => [...prev, ...items]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flash.success, flash.error, flash.warning, flash.info]);

    // Auto-remove after duration
    useEffect(() => {
        if (toasts.length === 0) return;
        const timer = setInterval(() => {
            const now = Date.now();
            setToasts((prev) => prev.filter((t) => now - t.createdAt < DURATION_MS));
        }, 250);
        return () => clearInterval(timer);
    }, [toasts.length]);

    const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-[min(92vw,22rem)] pointer-events-none">
            <style>{`
                @keyframes toast-in { from { opacity: 0; transform: translateX(120%) scale(.96); } to { opacity: 1; transform: translateX(0) scale(1); } }
                @keyframes toast-progress { from { transform: scaleX(1); } to { transform: scaleX(0); } }
                @keyframes toast-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
            `}</style>
            {toasts.map((t) => {
                const c = PALETTE[t.type];
                const Icon = c.icon;
                return (
                    <div
                        key={t.id}
                        className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/95 backdrop-blur-xl ring-1 ${c.border} ${c.glow} group`}
                        style={{ animation: 'toast-in 360ms cubic-bezier(.16,.84,.44,1) both' }}
                    >
                        {/* Top accent strip */}
                        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.accent}`} />

                        {/* Shimmer */}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-0 opacity-30"
                            style={{
                                backgroundImage: `linear-gradient(120deg, transparent 30%, rgba(255,255,255,.6) 50%, transparent 70%)`,
                                backgroundSize: '200% 100%',
                                animation: 'toast-shimmer 2.4s linear infinite',
                                mixBlendMode: 'overlay',
                            }}
                        />

                        <div className="relative flex items-start gap-3 p-4 pr-10">
                            <div className={`shrink-0 w-10 h-10 rounded-xl ${c.iconBg} text-white flex items-center justify-center shadow-lg`}>
                                <Icon size={20} className="drop-shadow-sm" />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-500 dark:text-slate-400">
                                    {labelFor(t.type)}
                                </p>
                                <p className="mt-0.5 text-sm leading-snug font-semibold text-slate-800 dark:text-slate-100 break-words">
                                    {t.message}
                                </p>
                            </div>
                            <button
                                onClick={() => dismiss(t.id)}
                                className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/5 dark:hover:text-white transition"
                                aria-label="Tutup"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Bottom progress bar */}
                        <div className="relative h-1 bg-slate-100 dark:bg-slate-800/60">
                            <div
                                className={`absolute inset-y-0 left-0 right-0 origin-left bg-gradient-to-r ${c.progress}`}
                                style={{ animation: `toast-progress ${DURATION_MS}ms linear forwards` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function labelFor(type: ToastType): string {
    switch (type) {
        case 'success': return 'Berhasil';
        case 'error':   return 'Kesalahan';
        case 'warning': return 'Peringatan';
        case 'info':    return 'Informasi';
    }
}
