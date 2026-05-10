import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {

    darkMode: 'class',

    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
                // MODO CLARO (Tus colores originales)
                "surface-dim": "#dadadc",
                "secondary-container": "#ffc1d0",
                "on-surface-variant": "#3f4848",
                "background": "#f9f9fc",
                "on-primary": "#ffffff",
                "on-background": "#1a1c1e",
                "surface": "#f9f9fc",
                "primary": "#0c5252",
                "surface-tint": "#2a6767",
                "outline-variant": "#bfc8c8",
                "surface-container-highest": "#e2e2e5",
                "surface-container-lowest": "#ffffff",
                "surface-container-low": "#f3f3f6",
                "surface-container-high": "#e8e8ea",
                "surface-container": "#eeeef0",
                "error": "#ba1a1a",
                "onError": "#ffffff",

                // VARIANTES PARA MODO OSCURO (Estilo VS Code / Slate)
                // Para usarlos, en tus componentes usas: dark:bg-dark-background
                "dark-background": "#0d0d0d", // Negro casi puro para el fondo
                "dark-surface": "#181818",    // Gris carbón para tarjetas (One Dark Pro style)
                "dark-primary": "#4ade80",     // Cambiamos a un Verde Esmeralda vibrante (resalta mejor en negro)
                "dark-on-surface": "#e5e5e5", // Gris muy claro para texto
                "dark-on-surface-variant": "#737373", // Gris medio para texto secundario
                "dark-outline": "#262626",    // Gris oscuro para bordes
                "dark-surface-container": "#121212",
            },
            fontFamily: {
                "body-md": ["Hanken Grotesk", ...defaultTheme.fontFamily.sans],
                "headline-lg": ["Manrope", ...defaultTheme.fontFamily.sans],
                "display-lg": ["Manrope", ...defaultTheme.fontFamily.sans],
                "body-sm": ["Hanken Grotesk", ...defaultTheme.fontFamily.sans],
                "headline-sm": ["Manrope", ...defaultTheme.fontFamily.sans],
                "label-md": ["Hanken Grotesk", ...defaultTheme.fontFamily.sans],
                "headline-md": ["Manrope", ...defaultTheme.fontFamily.sans]
            },
            spacing: {
                "margin-mobile": "16px",
                "margin-desktop": "48px",
                "base": "8px",
                "md": "24px",
                "sm": "12px",
                "lg": "40px",
                "xs": "4px"
            }
        },
    },

    plugins: [forms],
};