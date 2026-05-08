import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ auth }) {
    // Tasa BCV temporal para la interfaz
    const tasaBCV = 39.50;

    return (
        <div className="bg-background text-on-background antialiased min-h-screen">
            <Head title="Dashboard" />

            {/* TopAppBar */}
            <header className="docked full-width top-0 bg-surface shadow-sm fixed z-40 w-full border-b border-outline-variant/30">
                <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto h-[64px]">
                    <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-primary text-[24px]">icecream</span>
                        <span className="font-display-lg text-headline-md font-bold text-primary hidden sm:block">Heladería Pro</span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-label-md text-label-md text-on-surface-variant bg-surface-container-high px-sm py-xs rounded-full font-bold">
                            BCV: {tasaBCV} Bs
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content Canvas */}
            <main className="pt-[88px] pb-[100px] px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto flex flex-col gap-lg">

                {/* Header Section */}
                <div>
                    <h1 className="font-headline-lg text-headline-lg text-on-background">Resumen</h1>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Rendimiento de ventas del día.</p>
                </div>

                {/* Metrics Bento Grid */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-[0_4px_12px_rgba(45,106,106,0.08)]">
                    <div className="flex flex-col justify-between min-h-[140px]">
                        <div className="flex justify-between items-start w-full">
                            <span className="font-label-md text-label-md text-on-surface-variant uppercase font-bold">Ventas del Día</span>
                            <span className="material-symbols-outlined text-surface-tint">payments</span>
                        </div>
                        <div className="mt-base">
                            <div className="font-display-lg text-display-lg text-primary font-black">2,450.00 Bs</div>
                            <div className="flex items-center gap-xs mt-xs text-surface-tint">
                                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                                <span className="font-body-sm text-body-sm font-semibold">+18.5% vs ayer</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recently Completed Sales */}
                <div className="flex flex-col gap-sm">
                    <h2 className="font-headline-sm text-headline-sm text-on-background mb-xs font-bold">Ventas Recientes</h2>

                    <div className="flex flex-col gap-sm">
                        {/* Sale Item 1 */}
                        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-sm md:p-md flex items-center justify-between hover:bg-surface-container-low transition-colors duration-150">
                            <div className="flex items-center gap-sm">
                                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-body-md text-body-md text-on-background font-bold">3 Tetas (Chocolate, Coco)</span>
                                    <span className="font-body-sm text-body-sm text-on-surface-variant">Hoy, 2:15 PM • Caja #1</span>
                                </div>
                            </div>
                            <div className="font-headline-sm text-headline-sm text-on-background font-bold">
                                900.00 Bs
                            </div>
                        </div>

                        {/* Sale Item 2 */}
                        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-sm md:p-md flex items-center justify-between hover:bg-surface-container-low transition-colors duration-150">
                            <div className="flex items-center gap-sm">
                                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-body-md text-body-md text-on-background font-bold">1 Barquilla, 2 Tetas</span>
                                    <span className="font-body-sm text-body-sm text-on-surface-variant">Hoy, 1:45 PM • Caja #1</span>
                                </div>
                            </div>
                            <div className="font-headline-sm text-headline-sm text-on-background font-bold">
                                1,450.50 Bs
                            </div>
                        </div>
                    </div>

                    <button className="mt-sm self-start text-primary font-label-md text-label-md font-bold hover:opacity-80 transition-opacity">
                        VER TODAS LAS VENTAS
                    </button>
                </div>
            </main>

            {/* BottomNavBar (Navegación Principal) */}
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-container border-t border-outline-variant shadow-lg rounded-t-xl pb-6 sm:pb-2">

                {/* Dashboard (Activo) */}
                <Link href={route('dashboard')} className="flex flex-col items-center justify-center bg-secondary-container text-on-surface-variant rounded-full px-6 py-1">
                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                    <span className="font-label-md text-label-md mt-xs font-bold">Resumen</span>
                </Link>

                {/* POS (Inactivo por ahora) */}
                <button className="flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:bg-surface-container-highest transition-all rounded-lg px-4 py-1">
                    <span className="material-symbols-outlined text-[24px]">point_of_sale</span>
                    <span className="font-label-md text-label-md mt-xs font-bold">Venta</span>
                </button>

                {/* Inventario (Inactivo por ahora) */}
                <Link href={route('products.index')} className="flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:bg-surface-container-highest transition-all rounded-lg px-4 py-1">
                    <span className="material-symbols-outlined text-[24px]">inventory_2</span>
                    <span className="font-label-md text-label-md mt-xs font-bold">Inventario</span>
                </Link>

            </nav>
        </div>
    );
}