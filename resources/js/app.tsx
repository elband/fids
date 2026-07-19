import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ConfirmProvider } from '@/Components/ConfirmDialog';
import ErrorBoundary from '@/Components/ErrorBoundary';
import OfflineIndicator from '@/Components/OfflineIndicator';
import ReloadWatcher from '@/Components/ReloadWatcher';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ConfirmProvider>
                <ErrorBoundary>
                    <App {...props} />
                </ErrorBoundary>
                {/* Di luar boundary: tetap hidup walau <App> crash, agar layar publik
                    bisa memantau sinyal reload & status offline. */}
                <OfflineIndicator />
                <ReloadWatcher />
            </ConfirmProvider>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
