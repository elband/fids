import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Penjaga error render untuk seluruh aplikasi.
 *
 * Layar publik FIDS berjalan 24/7 tanpa operator. Tanpa penjaga ini, satu
 * exception saat render (mis. sebuah field API bernilai null lalu dipanggil
 * `.substring()` / `.split()`) akan meng-unmount seluruh pohon React dan
 * menyisakan layar hitam permanen sampai perangkat di-reload manual.
 *
 * Strategi:
 *  - Tangkap error, tampilkan fallback ringkas (bukan layar kosong).
 *  - Di halaman publik, jadwalkan reload otomatis agar layar pulih sendiri.
 *  - Di halaman admin, cukup tampilkan tombol muat ulang manual.
 */
const AUTO_RELOAD_MS = 15000;

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

function isPublicScreen(): boolean {
    if (typeof window === 'undefined') return false;
    return /^\/(public|display|mclock)/.test(window.location.pathname);
}

export default class ErrorBoundary extends Component<Props, State> {
    private reloadTimer: number | null = null;

    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        // Catat ke konsol untuk diagnosa; jangan pernah melempar ulang.
        // eslint-disable-next-line no-console
        console.error('FIDS render error:', error, info?.componentStack);

        if (isPublicScreen() && this.reloadTimer === null) {
            // Layar kiosk: pulihkan diri dengan memuat ulang setelah jeda singkat.
            this.reloadTimer = window.setTimeout(() => {
                window.location.reload();
            }, AUTO_RELOAD_MS);
        }
    }

    componentWillUnmount(): void {
        if (this.reloadTimer !== null) {
            window.clearTimeout(this.reloadTimer);
            this.reloadTimer = null;
        }
    }

    render(): ReactNode {
        if (!this.state.hasError) {
            return this.props.children;
        }

        const publicScreen = isPublicScreen();

        return (
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    fontFamily: 'system-ui, sans-serif',
                    textAlign: 'center',
                    padding: '2rem',
                    zIndex: 99999,
                }}
            >
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    Terjadi gangguan menampilkan layar
                </div>
                <div style={{ fontSize: '1rem', opacity: 0.8 }}>
                    {publicScreen
                        ? 'Layar akan memuat ulang secara otomatis…'
                        : 'Silakan muat ulang halaman.'}
                </div>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    style={{
                        marginTop: '0.5rem',
                        padding: '0.6rem 1.4rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #334155',
                        background: '#1e293b',
                        color: '#e2e8f0',
                        fontSize: '1rem',
                        cursor: 'pointer',
                    }}
                >
                    Muat ulang
                </button>
            </div>
        );
    }
}
