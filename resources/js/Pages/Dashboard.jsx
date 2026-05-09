import { Head, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

export default function Dashboard({ auth }) {
    // Tasa BCV temporal para la interfaz
    const tasaBCV = 39.50;

    return (
        <MainLayout>

            <div className="bg-background text-on-background antialiased min-h-screen">
                <Head title="Dashboard" />


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


            </div>
        </MainLayout>

    );
}