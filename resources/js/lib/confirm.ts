// Helper non-React untuk panggil custom confirm dari mana saja.
// Provider akan mendaftarkan implementasinya saat mount.

export interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success' | 'question';
    icon?: React.ReactNode;
}

let globalConfirm: ((opts: ConfirmOptions) => Promise<boolean>) | null = null;

export function setGlobalConfirm(fn: ((opts: ConfirmOptions) => Promise<boolean>) | null) {
    globalConfirm = fn;
}

export function appConfirm(opts: ConfirmOptions): Promise<boolean> {
    if (globalConfirm) return globalConfirm(opts);
    return Promise.resolve(window.confirm(opts.message));
}
