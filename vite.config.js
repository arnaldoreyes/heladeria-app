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
                name: 'Ice King',
                short_name: 'Ice King',
                description: 'Punto de Venta e Inventario',
                theme_color: '#006a60',
                background_color: '#1C7089',
                display: 'standalone',
                start_url: '/',
                icons: [
                    {
                        src: '/img/new_icon_192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/img/new_icon_512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ],
                screenshots: [
                    {
                        src: '/img/new_icon_512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        form_factor: 'wide'
                    },
                    {
                        src: '/img/new_icon_512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
                cleanupOutdatedCaches: true,
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 30
                            }
                        }
                    },
                    {
                        urlPattern: /\.(?:js|css)$/i,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'static-resources',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 7
                            }
                        }
                    }
                ]
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
    build: {
        sourcemap: false,
        cssCodeSplit: true,
        chunkSizeWarningLimit: 1000,
    },
    esbuild: {
        sourcemap: false,
        drop: ['console', 'debugger'],
    },
    optimizeDeps: {
        esbuildOptions: {
            sourcemap: false,
        },
    },
});