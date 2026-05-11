import { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function MainLayout({ children }) {

    const [isDarkMode, setIsDarkMode] = useState(false);

    const { url } = usePage();
    const { tasa_bcv } = usePage().props;

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDarkMode(true);
        }
    };

    // Añadimos iconos a los enlaces para la versión móvil
    const navLinks = [
        { name: 'Resumen', href: route('dashboard'), active: url.startsWith('/dashboard'), icon: 'space_dashboard' },
        { name: 'Venta', href: route('pos.index'), active: url.startsWith('/pos') || url === '/', icon: 'point_of_sale' },
        { name: 'Inventario', href: route('products.index'), active: url.startsWith('/products'), icon: 'inventory_2' },
    ];

    return (
        <div className="min-h-screen bg-background dark:bg-dark-background text-on-background dark:text-dark-on-surface transition-colors duration-300 pb-16 md:pb-0">

            {/* TOP NAVBAR (Común para todos) */}
            <nav className="bg-surface dark:bg-dark-surface border-b border-outline-variant dark:border-dark-outline sticky top-0 z-50 transition-colors duration-300 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                    <div className="flex justify-between h-16 items-center">

                        {/* Logo a la izquierda (Ahora es clickeable) */}
                        <Link href={route('dashboard')} className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity cursor-pointer">
                            <span className="material-symbols-outlined text-primary dark:text-dark-primary text-[28px]">
                                crown
                            </span>
                            <span className="font-headline-sm font-bold text-primary dark:text-dark-primary hidden sm:block tracking-wide">
                                Ice King Popsicle
                            </span>
                        </Link>

                        {/* Enlaces al centro (SOLO PC / TABLET HORIZONTAL) */}
                        <div className="hidden md:flex space-x-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 ${link.active
                                        ? 'bg-primary text-on-primary shadow-sm dark:bg-dark-primary dark:text-dark-background'
                                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface dark:text-dark-on-surface-variant dark:hover:bg-dark-background dark:hover:text-dark-on-surface'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {/* Controles a la derecha */}
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="bg-surface-container-high dark:bg-dark-background text-on-surface dark:text-dark-on-surface font-bold text-sm px-4 py-1.5 rounded-full border border-outline-variant/50 dark:border-dark-outline shadow-sm transition-colors">
                                BCV: {tasa_bcv.toFixed(2)} Bs
                            </div>

                            <button
                                onClick={toggleTheme}
                                className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container dark:hover:bg-dark-background hover:text-primary dark:hover:text-dark-primary transition-all active:scale-95 border border-transparent dark:border-dark-outline"
                                title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                            >
                                <span className="material-symbols-outlined text-[22px]">
                                    {isDarkMode ? 'light_mode' : 'dark_mode'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* CONTENIDO DE LA PÁGINA */}
            <main>
                {children}
            </main>

            {/* BOTTOM NAVIGATION BAR (SOLO MÓVIL) */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface dark:bg-dark-surface border-t border-outline-variant dark:border-dark-outline z-[90] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-none pb-safe">
                <div className="flex justify-around items-center h-16 px-2">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${link.active
                                ? 'text-primary dark:text-dark-primary'
                                : 'text-on-surface-variant dark:text-dark-on-surface-variant hover:text-on-surface dark:hover:text-white'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[24px] ${link.active ? 'drop-shadow-sm' : ''}`} style={link.active ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                {link.icon}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{link.name}</span>
                        </Link>
                    ))}
                </div>
            </nav>

        </div>
    );
}