import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
        legacy({
            targets: ['chrome >= 74'],
            additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
        }),
    ],
    server: {
        host: '127.0.0.1',
    },
    optimizeDeps: {
        include: ['recharts', 'react-is']
    }
});
