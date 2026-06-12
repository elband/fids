import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X, Trash2, HelpCircle, type LucideIcon } from 'lucide-react';
import { setGlobalConfirm, type ConfirmOptions } from '@/lib/confirm';

type DialogVariant = 'danger' | 'warning' | 'info' | 'success' | 'question';

interface DialogState extends ConfirmOptions {
    open: boolean;
    resolve?: (value: boolean) => void;
}

interface ConfirmContextValue {
    confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

const VARIANT_PALETTE: Record<DialogVariant, {
    iconBg: string;
    iconColor: string;
    accentBar: string;
    confirmBtn: string;
    Icon: LucideIcon;
}> = {
    danger: {
        iconBg: 'bg-rose-100 dark:bg-rose-900/40',
        iconColor: 'text-rose-600 dark:text-rose-300',
        accentBar: 'from-rose-500 via-red-500 to-pink-500',
        confirmBtn: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 focus:ring-rose-300',
        Icon: Trash2,
    },
    warning: {
        iconBg: 'bg-amber-100 dark:bg-amber-900/40',
        iconColor: 'text-amber-600 dark:text-amber-300',
        accentBar: 'from-amber-500 via-orange-500 to-rose-500',
        confirmBtn: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 focus:ring-amber-300',
        Icon: AlertTriangle,
    },
    info: {
        iconBg: 'bg-sky-100 dark:bg-sky-900/40',
        iconColor: 'text-sky-600 dark:text-sky-300',
        accentBar: 'from-sky-500 via-cyan-500 to-blue-500',
        confirmBtn: 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 focus:ring-sky-300',
        Icon: Info,
    },
    success: {
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
        iconColor: 'text-emerald-600 dark:text-emerald-300',
        accentBar: 'from-emerald-500 via-teal-500 to-cyan-500',
        confirmBtn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:ring-emerald-300',
        Icon: CheckCircle2,
    },
    question: {
        iconBg: 'bg-fuchsia-100 dark:bg-fuchsia-900/40',
        iconColor: 'text-fuchsia-600 dark:text-fuchsia-300',
        accentBar: 'from-fuchsia-500 via-purple-500 to-indigo-500',
        confirmBtn: 'bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 focus:ring-fuchsia-300',
        Icon: HelpCircle,
    },
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<DialogState>({ open: false, message: '' });

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({ ...opts, open: true, resolve });
        });
    }, []);

    useEffect(() => {
        setGlobalConfirm(confirm);
        return () => setGlobalConfirm(null);
    }, [confirm]);

    const handleClose = (value: boolean) => {
        state.resolve?.(value);
        setState((s) => ({ ...s, open: false }));
    };

    useEffect(() => {
        if (!state.open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose(false);
            if (e.key === 'Enter')  handleClose(true);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.open]);

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {state.open && createPortal(<DialogView state={state} onClose={handleClose} />, document.body)}
        </ConfirmContext.Provider>
    );
}

function DialogView({ state, onClose }: { state: DialogState; onClose: (v: boolean) => void }) {
    const variant = state.variant ?? 'question';
    const palette = VARIANT_PALETTE[variant];
    const Icon = palette.Icon;
    const title = state.title ?? defaultTitle(variant);
    const confirmText = state.confirmText ?? 'Ya, Lanjutkan';
    const cancelText  = state.cancelText  ?? 'Batal';

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
        >
            <style>{`
                @keyframes confirm-in   { from { opacity: 0; transform: translateY(20px) scale(.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes backdrop-in  { from { opacity: 0; } to { opacity: 1; } }
                @keyframes ring-pulse   { 0%,100% { transform: scale(1); opacity: .35; } 50% { transform: scale(1.15); opacity: .15; } }
            `}</style>

            <div
                className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
                style={{ animation: 'backdrop-in 200ms ease-out' }}
                onClick={() => onClose(false)}
            />

            <div
                className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 overflow-hidden"
                style={{ animation: 'confirm-in 280ms cubic-bezier(.16,.84,.44,1) both' }}
            >
                <div className={`h-1 w-full bg-gradient-to-r ${palette.accentBar}`} />

                <button
                    type="button"
                    onClick={() => onClose(false)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/10 transition"
                    aria-label="Tutup"
                >
                    <X size={16} />
                </button>

                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                            <span
                                aria-hidden
                                className={`absolute inset-0 rounded-2xl ${palette.iconBg}`}
                                style={{ animation: 'ring-pulse 2s ease-in-out infinite' }}
                            />
                            <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center ${palette.iconBg} ${palette.iconColor} ring-1 ring-current/10`}>
                                {state.icon ?? <Icon size={26} />}
                            </div>
                        </div>

                        <div className="min-w-0 flex-1">
                            <h3 id="confirm-dialog-title" className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                                {title}
                            </h3>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                {state.message}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => onClose(false)}
                            className="inline-flex justify-center items-center px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={() => onClose(true)}
                            className={`inline-flex justify-center items-center px-5 py-2 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl active:scale-[.98] focus:outline-none focus:ring-4 transition ${palette.confirmBtn}`}
                            autoFocus
                        >
                            {confirmText}
                        </button>
                    </div>

                    <div className="mt-3 text-center text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold">
                        Enter untuk lanjut · Esc untuk batal
                    </div>
                </div>
            </div>
        </div>
    );
}

function defaultTitle(variant: DialogVariant): string {
    switch (variant) {
        case 'danger': return 'Konfirmasi Hapus';
        case 'warning': return 'Perhatian';
        case 'info':
        case 'success':
        case 'question': return 'Konfirmasi';
    }
}

export function useConfirm(): (opts: ConfirmOptions) => Promise<boolean> {
    const ctx = useContext(ConfirmContext);
    if (!ctx) {
        return (opts: ConfirmOptions) => Promise.resolve(window.confirm(opts.message));
    }
    return ctx.confirm;
}
