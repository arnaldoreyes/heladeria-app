import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        VitePWA({
            outDir: 'public', // Genera el sw.js en la raíz para que tenga control total
            buildBase: '/',
            scope: '/',
            registerType: 'autoUpdate',
            manifest: {
                name: 'Ice King Popsicle',
                short_name: 'Ice King',
                description: 'Punto de Venta e Inventario',
                theme_color: '#006a60',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/',
                icons: [
                    {
                        src: '/img/Icon_192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/img/Icon_512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ],
                screenshots: [
                    {
                        src: '/img/Icon_512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        form_factor: 'wide'
                    },
                    {
                        src: '/img/Icon_512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                navigateFallback: '/',
                globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
                cleanupOutdatedCaches: true,
                // EL FIX: Le indicamos al Service Worker la ruta real del manifiesto
                modifyURLPrefix: {
                    'manifest.webmanifest': 'build/manifest.webmanifest'
                }
            }
        })
    ],
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        hmr: {
            host: 'localhost',
        },
        watch: {
            usePolling: true,
        },
    },
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});