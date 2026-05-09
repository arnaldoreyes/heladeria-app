import { Link } from '@inertiajs/react';

export default function MainLayout({ children, title }) {
    // Tasa BCV (Por ahora estática, luego la pasaremos desde el backend)
    const tasaBCV = 500.46;

    return (
        <div className="bg-background text-on-background min-h-screen font-body-md antialiased pb-[80px] md:pb-0 relative overflow-hidden">

            {/* TopAppBar Compartida */}
            <header className="bg-surface dark:bg-on-background shadow-sm dark:border-b dark:border-outline-variant docked full-width top-0 sticky z-40">
                <div className="flex justify-between items-center w-full max-w-7xl mx-auto h-20 md:px-margin-desktop px-margin-mobile">
                    <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-primary dark:text-inverse-primary text-[32px]">icecream</span>
                        <h1 className="font-display-lg text-headline-md font-bold text-primary dark:text-inverse-primary hidden sm:block">ScoopMaster Pro</h1>
                    </div>

                    {/* Desktop Nav Cluster (Oculto en móviles) */}
                    <nav className="hidden md:flex items-center gap-md">
                        <Link href={route('dashboard')} className={`font-body-md px-4 py-2 rounded-lg font-bold transition-colors ${route().current('dashboard') ? 'text-primary bg-surface-container-low' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>Resumen</Link>
                        <Link href={route('pos')} className={`font-body-md px-4 py-2 rounded-lg font-bold transition-colors ${route().current('pos') ? 'text-primary bg-surface-container-low' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>Venta</Link>
                        <Link href={route('products.index')} className={`font-body-md px-4 py-2 rounded-lg font-bold transition-colors ${route().current('products.index') ? 'text-primary bg-surface-container-low' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>Inventario</Link>
                    </nav>

                    <div className="flex items-center">
                        <div className="font-label-md text-label-md text-on-surface-variant bg-surface-container-high px-4 py-2 rounded-full shadow-inner font-bold border border-outline-variant/30">
                            BCV: {tasaBCV} Bs
                        </div>
                    </div>
                </div>
            </header>

            {/* Aquí se inyectará el contenido específico de cada vista */}
            {children}

            {/* BottomNavBar (Solo para móviles) */}
            <nav className="md:hidden bg-surface-container dark:bg-surface-dim border-t border-outline-variant shadow-[0_-4px_20px_rgba(0,0,0,0.05)] docked full-width bottom-0 rounded-t-2xl fixed left-0 w-full z-50 flex justify-around items-center px-4 py-2 pb-6 sm:pb-2">
                <Link href={route('dashboard')} className={`flex flex-col items-center justify-center py-1.5 w-[72px] rounded-2xl transition-all ${route().current('dashboard') ? 'bg-secondary-container text-on-secondary-container shadow-sm scale-105' : 'text-on-surface-variant opacity-70 hover:bg-surface-container-highest'}`}>
                    <span className="material-symbols-outlined text-[24px] mb-1" style={route().current('dashboard') ? { fontVariationSettings: "'FILL' 1" } : {}}>dashboard</span>
                    <span className="font-label-md text-[10px] font-bold">Resumen</span>
                </Link>

                <Link href={route('pos')} className={`flex flex-col items-center justify-center py-1.5 w-[72px] rounded-2xl transition-all ${route().current('pos') ? 'bg-secondary-container text-on-secondary-container shadow-sm scale-105' : 'text-on-surface-variant opacity-70 hover:bg-surface-container-highest'}`}>
                    <span className="material-symbols-outlined text-[24px] mb-1" style={route().current('pos') ? { fontVariationSettings: "'FILL' 1" } : {}}>point_of_sale</span>
                    <span className="font-label-md text-[10px] font-bold">Venta</span>
                </Link>

                <Link href={route('products.index')} className={`flex flex-col items-center justify-center py-1.5 w-[72px] rounded-2xl transition-all ${route().current('products.index') ? 'bg-secondary-container text-on-secondary-container shadow-sm scale-105' : 'text-on-surface-variant opacity-70 hover:bg-surface-container-highest'}`}>
                    <span className="material-symbols-outlined text-[24px] mb-1" style={route().current('products.index') ? { fontVariationSettings: "'FILL' 1" } : {}}>inventory_2</span>
                    <span className="font-label-md text-[10px] font-bold">Inventario</span>
                </Link>
            </nav>

        </div>
    );
}