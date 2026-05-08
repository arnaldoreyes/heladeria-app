import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
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