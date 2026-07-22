import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

export default function Dashboard({
    totalVentasBs, totalVentasUsd, totalCostUsd = 0, totalMarginUsd = 0, totalReinvestmentUsd = 0, totalProfitUsd = 0,
    cantidadVentas, ventasRecientes, totalPerdidaBs = 0, totalPerdidaUsd = 0, topProductos = [],
    monthlyHistory = [], totalHoyUsd, totalHoyBs
}) {
    // CAPTURAMOS LA CONFIGURACIÓN GLOBAL DESDE INERTIA
    const { profit_percentage, business_percentage, tasa_bcv } = usePage().props;
    const tasaBCV = Number(tasa_bcv || 1);

    const [selectedSale, setSelectedSale] = useState(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isTopGlobalOpen, setIsTopGlobalOpen] = useState(false);

    // --- ESTADOS PARA EL HISTÓRICO MENSUAL ---
    const [isMonthlySidebarOpen, setIsMonthlySidebarOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(null);

    // Escape para cerrar todos los modales
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                if (selectedSale) setSelectedSale(null);
                else if (selectedMonth) setSelectedMonth(null);
                else if (isHistoryOpen) setIsHistoryOpen(false);
                else if (isTopGlobalOpen) setIsTopGlobalOpen(false);
                else if (isMonthlySidebarOpen) setIsMonthlySidebarOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [selectedSale, selectedMonth, isHistoryOpen, isTopGlobalOpen, isMonthlySidebarOpen]);

    // --- FORMATEADORES ---
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    };

    const getCurrentFormattedDate = () => {
        const date = new Date();
        const formatted = new Intl.DateTimeFormat('es-VE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(date);
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    // Helper para verificar si el ticket fue creado el día de hoy
    const isSaleFromToday = (dateString) => {
        if (!dateString) return false;
        const saleDate = new Date(dateString);
        const today = new Date();
        return saleDate.toDateString() === today.toDateString();
    };

    // --- MATEMÁTICA DE LOS 3 FONDOS (REPOSICIÓN + MARGEN DISTRIBUIDO) ---
    const fondoReposicionUsd = Number(totalCostUsd || 0);
    const fondoReposicionBs = fondoReposicionUsd * tasaBCV;

    const fondoReinversionUsd = Number(totalReinvestmentUsd || 0);
    const fondoReinversionBs = fondoReinversionUsd * tasaBCV;

    const gananciaRealUsd = Math.max(0, Number(totalProfitUsd || 0) - Number(totalPerdidaUsd || 0));
    const gananciaRealBs = gananciaRealUsd * tasaBCV;

    const paymentIcons = {
        'Efectivo': 'payments',
        'Pago Movil': 'smartphone',
        'Divisas': 'attach_money'
    };

    const top3Productos = topProductos.slice(0, 3);

    return (
        <MainLayout>
            <Head title="Resumen Financiero" />

            <main className="pt-8 md:pt-[40px] px-margin-mobile md:px-margin-desktop max-w-6xl mx-auto flex flex-col gap-lg h-full pb-20 transition-colors">

                {/* ENCABEZADO: FECHA Y BOTÓN HISTÓRICO (Selectores eliminados) */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                    <div className="w-full md:w-auto">
                        <p className="text-sm md:text-base text-primary dark:text-dark-primary font-black uppercase tracking-widest flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                            {getCurrentFormattedDate()}
                        </p>
                    </div>

                    <div className="flex flex-row items-center justify-between md:justify-end gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setIsMonthlySidebarOpen(true)}
                            className="flex items-center gap-1.5 px-3 h-[34px] rounded-lg border border-outline-variant dark:border-dark-outline text-on-surface-variant dark:text-dark-on-surface-variant font-black text-xs uppercase tracking-wider hover:bg-surface-container-high dark:hover:bg-dark-surface-container transition-colors shrink-0 bg-surface dark:bg-dark-surface"
                        >
                            <span className="material-symbols-outlined text-[16px]">folder_open</span>
                            Histórico Mensual
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-4 w-full">

                    {/* TARJETA PRINCIPAL - DISTRIBUCIÓN DEL DINERO (MES EN CURSO) */}
                    <div className="bg-surface-container-lowest dark:bg-dark-surface border border-outline-variant dark:border-dark-outline rounded-xl shadow-sm relative overflow-hidden flex flex-col w-full transition-all">

                        <div className="bg-surface-container-low dark:bg-dark-surface-container border-b border-outline-variant dark:border-dark-outline p-5 flex flex-row justify-between items-start gap-4">
                            <div className="flex flex-col">
                                <h3 className="font-label-lg text-on-surface-variant dark:text-dark-on-surface-variant font-bold uppercase tracking-widest text-[10px] mb-1">Venta Bruta Total</h3>
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="font-display-md text-3xl font-black text-on-surface dark:text-white leading-none tracking-tighter">
                                        ${formatMoney(totalVentasUsd)}
                                    </span>
                                    <span className="text-sm font-bold text-on-surface-variant dark:text-dark-on-surface-variant opacity-70 whitespace-nowrap">
                                        / {formatMoney(totalVentasBs)} Bs
                                    </span>
                                </div>
                            </div>
                            <div className="shrink-0 bg-primary/10 dark:bg-dark-primary/10 text-primary dark:text-dark-primary px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-1 border border-primary/20 dark:border-dark-primary/20 items-start">
                                <span className="material-symbols-outlined text-[14px] sm:text-[16px]">receipt_long</span>
                                <span className="whitespace-nowrap">{cantidadVentas} Ventas</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-outline-variant dark:divide-dark-outline">

                            <div className="p-5 md:p-6 flex flex-col relative group">
                                <div className="flex flex-row justify-between items-start gap-2 mb-3 relative z-10">
                                    <h3 className="font-label-lg text-on-surface dark:text-dark-on-surface font-black uppercase tracking-widest text-xs flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[18px] text-blue-500">inventory_2</span>
                                        Fondo Reposición
                                    </h3>
                                </div>
                                <div className="flex flex-col mt-auto relative z-10">
                                    <span className="font-display-lg text-3xl lg:text-4xl font-black text-on-surface dark:text-white leading-none tracking-tighter">
                                        ${formatMoney(fondoReposicionUsd)}
                                    </span>
                                    <span className="text-xs font-bold text-on-surface-variant dark:text-dark-on-surface-variant mt-2">
                                        ~ {formatMoney(fondoReposicionBs)} Bs
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 md:p-6 flex flex-col relative group">
                                <div className="flex flex-row justify-between items-start gap-2 mb-3 relative z-10">
                                    <h3 className="font-label-lg text-on-surface dark:text-dark-on-surface font-black uppercase tracking-widest text-xs flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[18px] text-indigo-500">domain_add</span>
                                        Fondo Reinversión ({business_percentage}%)
                                    </h3>
                                </div>
                                <div className="flex flex-col mt-auto relative z-10">
                                    <span className="font-display-lg text-3xl lg:text-4xl font-black text-on-surface dark:text-white leading-none tracking-tighter">
                                        ${formatMoney(fondoReinversionUsd)}
                                    </span>
                                    <span className="text-xs font-bold text-on-surface-variant dark:text-dark-on-surface-variant mt-2">
                                        ~ {formatMoney(fondoReinversionBs)} Bs
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 md:p-6 flex flex-col relative bg-primary/5 dark:bg-[#111810]">
                                <div className="flex flex-row justify-between items-start gap-2 mb-3 relative z-10">
                                    <h3 className="font-label-lg text-primary dark:text-dark-primary font-black uppercase tracking-widest text-xs flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                                        Ganancia Neta ({profit_percentage}%)
                                    </h3>
                                    {totalPerdidaUsd > 0 && (
                                        <div className="shrink-0 bg-error/10 text-error px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-error/20">
                                            <span className="material-symbols-outlined text-[12px]">money_off</span>
                                            -${formatMoney(totalPerdidaUsd)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col mt-auto relative z-10">
                                    <span className="font-display-lg text-3xl lg:text-4xl font-black text-primary dark:text-dark-primary leading-none tracking-tighter">
                                        ${formatMoney(gananciaRealUsd)}
                                    </span>
                                    <span className="text-xs font-bold text-on-surface-variant dark:text-dark-on-surface-variant mt-2">
                                        ~ {formatMoney(gananciaRealBs)} Bs
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* COLUMNAS INFERIORES */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* TOP 3 PRODUCTOS (MES EN CURSO) */}
                    <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-headline-sm font-bold text-on-surface dark:text-dark-on-surface tracking-tight flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary dark:text-dark-primary text-[20px]">stars</span>
                                Top 3 Estrella
                            </h2>
                            <button onClick={() => setIsTopGlobalOpen(true)} className="flex items-center gap-1.5 text-[10px] font-black text-primary dark:text-dark-primary uppercase tracking-widest hover:opacity-80 transition-all">
                                <span className="material-symbols-outlined text-[16px]">leaderboard</span> Ver Global
                            </button>
                        </div>

                        <div className="flex flex-col gap-2.5">
                            {top3Productos && top3Productos.length > 0 ? (
                                top3Productos.map((producto, index) => (
                                    <div key={producto.id} className="bg-surface-container-lowest dark:bg-dark-surface border border-outline-variant dark:border-dark-outline rounded-xl p-4 flex justify-between items-center shadow-sm transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-surface-container dark:bg-dark-background flex items-center justify-center font-black text-on-surface-variant dark:text-dark-on-surface-variant border dark:border-dark-outline text-xs">
                                                #{index + 1}
                                            </div>
                                            <p className="font-bold text-on-surface dark:text-dark-on-surface uppercase text-sm tracking-tight">{producto.name}</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className="font-black text-lg text-primary dark:text-dark-primary leading-none">{producto.total_vendido}</span>
                                            <span className="text-[9px] font-bold uppercase text-on-surface-variant dark:text-dark-on-surface-variant tracking-widest mt-1">Vendidos</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-8 border border-dashed border-outline-variant dark:border-dark-outline rounded-xl bg-surface-container-lowest dark:bg-dark-surface/30">
                                    <p className="text-on-surface-variant dark:text-dark-on-surface-variant font-medium text-sm">Sin datos para este mes.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* VENTAS RECIENTES (LAS DE HOY CON INDICADOR) */}
                    <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm md:text-headline-sm font-bold text-on-surface dark:text-dark-on-surface tracking-tight flex items-center gap-2">
                                Ventas de Hoy
                                <span className="bg-primary/10 dark:bg-dark-primary/10 text-primary dark:text-dark-primary px-2 py-0.5 rounded text-sm">${formatMoney(totalHoyUsd)}</span>
                            </h2>
                            <button onClick={() => setIsHistoryOpen(true)} className="flex items-center gap-1.5 text-[10px] font-black text-primary dark:text-dark-primary uppercase tracking-widest hover:opacity-80 transition-all">
                                <span className="material-symbols-outlined text-[16px]">history</span> Historial (Hoy)
                            </button>
                        </div>

                        <div className="flex flex-col gap-2.5">
                            {ventasRecientes && ventasRecientes.length > 0 ? (
                                ventasRecientes.map(venta => (
                                    <div key={venta.id} onClick={() => setSelectedSale(venta)} className="bg-surface-container-lowest dark:bg-dark-surface border border-outline-variant dark:border-dark-outline rounded-xl p-4 flex justify-between items-center shadow-sm hover:border-primary dark:hover:border-dark-primary cursor-pointer hover:bg-surface-container-lowest/80 dark:hover:bg-neutral-800 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-9 h-9 rounded-lg bg-surface-container dark:bg-dark-background flex items-center justify-center text-primary dark:text-dark-primary shrink-0 border dark:border-dark-outline">
                                                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-on-surface dark:text-dark-on-surface uppercase text-xs tracking-wider group-hover:text-primary dark:group-hover:text-dark-primary">Ticket #{venta.id}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-[11px] text-on-surface-variant dark:text-dark-on-surface-variant font-medium">{formatTime(venta.created_at)}</p>
                                                    {venta.payment_method && (
                                                        <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-surface-container-high dark:bg-dark-surface px-1.5 py-0.5 rounded border dark:border-dark-outline text-on-surface-variant dark:text-dark-on-surface-variant">
                                                            <span className="material-symbols-outlined text-[10px]">{paymentIcons[venta.payment_method] || 'payments'}</span>
                                                            {venta.payment_method}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <p className="text-xs text-primary dark:text-dark-primary font-black tracking-tight">${formatMoney(venta.total_usd)}</p>
                                            <p className="font-bold text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant opacity-70 mt-0.5">/ {formatMoney(venta.total_bs)} Bs</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-8 border border-dashed border-outline-variant dark:border-dark-outline rounded-xl bg-surface-container-lowest dark:bg-dark-surface/30">
                                    <p className="text-on-surface-variant dark:text-dark-on-surface-variant font-medium text-sm">Aún no hay ventas el día de hoy.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* SIDEBAR: RANKING TOP GLOBAL */}
            <div className={`fixed inset-0 z-[110] transition-all duration-300 ${isTopGlobalOpen ? 'visible' : 'invisible'}`}>
                <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isTopGlobalOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsTopGlobalOpen(false)} />
                <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-surface dark:bg-dark-surface shadow-2xl border-l border-outline-variant dark:border-dark-outline transform transition-transform duration-300 flex flex-col ${isTopGlobalOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="p-6 border-b border-outline-variant dark:border-dark-outline flex justify-between items-center bg-surface-container-low dark:bg-dark-background/50">
                        <div>
                            <h3 className="font-headline-sm font-black text-on-surface dark:text-white uppercase tracking-tighter text-lg">Top Global</h3>
                            <p className="text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant font-bold uppercase tracking-widest">Del mes en curso</p>
                        </div>
                        <button onClick={() => setIsTopGlobalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-error/10 text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-all">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-2">
                        {topProductos.map((producto, index) => (
                            <div key={producto.id} className="p-4 rounded-xl border border-outline-variant dark:border-dark-outline bg-surface-container-lowest dark:bg-dark-background/40 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-surface-container dark:bg-dark-background flex items-center justify-center font-black text-on-surface-variant dark:text-dark-on-surface-variant border dark:border-dark-outline text-xs">
                                        #{index + 1}
                                    </div>
                                    <p className="font-bold text-xs text-on-surface dark:text-white uppercase tracking-tight">{producto.name}</p>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="font-black text-sm text-primary dark:text-dark-primary tracking-tight">{producto.total_vendido} <span className="text-[9px] font-bold text-on-surface-variant dark:text-dark-on-surface-variant uppercase ml-0.5">UND</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SIDEBAR: HISTÓRICO MENSUAL */}
            <div className={`fixed inset-0 z-[110] transition-all duration-300 ${isMonthlySidebarOpen ? 'visible' : 'invisible'}`}>
                <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMonthlySidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMonthlySidebarOpen(false)} />
                <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-surface dark:bg-dark-surface shadow-2xl border-l border-outline-variant dark:border-dark-outline transform transition-transform duration-300 flex flex-col ${isMonthlySidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="p-6 border-b border-outline-variant dark:border-dark-outline flex justify-between items-center bg-surface-container-low dark:bg-dark-background/50">
                        <div>
                            <h3 className="font-headline-sm font-black text-on-surface dark:text-white uppercase tracking-tighter text-lg">Cierres Mensuales</h3>
                            <p className="text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant font-bold uppercase tracking-widest">Historial de la aplicación</p>
                        </div>
                        <button onClick={() => setIsMonthlySidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-error/10 text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-all">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-2">
                        {monthlyHistory.map(month => (
                            <div
                                key={month.id}
                                onClick={() => setSelectedMonth(month)}
                                className="p-4 rounded-xl border border-outline-variant dark:border-dark-outline bg-surface-container-lowest dark:bg-dark-background/40 flex justify-between items-center cursor-pointer hover:border-primary dark:hover:border-dark-primary hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-surface-container dark:bg-dark-surface flex items-center justify-center text-primary dark:text-dark-primary group-hover:scale-110 transition-transform border border-transparent dark:border-dark-outline">
                                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-xs text-on-surface dark:text-white uppercase tracking-wider group-hover:text-primary dark:group-hover:text-dark-primary transition-colors">{month.month_name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant font-medium">{month.sales_count} Ventas</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="font-black text-sm text-primary dark:text-dark-primary tracking-tight">${formatMoney(month.total_usd)}</p>
                                </div>
                            </div>
                        ))}
                        {monthlyHistory.length === 0 && (
                            <div className="text-center p-8 border border-dashed border-outline-variant dark:border-dark-outline rounded-xl bg-surface-container-lowest dark:bg-dark-surface/30">
                                <p className="text-on-surface-variant dark:text-dark-on-surface-variant font-medium text-sm">No hay registros mensuales.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL DEL HISTÓRICO MENSUAL ESPECÍFICO */}
            {selectedMonth && (
                <div 
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in transition-all overflow-y-auto"
                    onClick={() => setSelectedMonth(null)}
                >
                    <div 
                        className="bg-surface-container-lowest dark:bg-dark-surface w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden border dark:border-dark-outline m-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* LEFT PANEL - STATS */}
                        <div className="flex flex-col md:w-[380px] shrink-0 border-b md:border-b-0 md:border-r border-outline-variant/50 dark:border-dark-outline">
                            <div className="px-5 py-5 border-b border-outline-variant/50 dark:border-dark-outline flex flex-col gap-4 bg-surface-bright dark:bg-dark-surface-container">
                                <div className="flex justify-between items-center">
                                    <h2 className="font-headline-sm font-black text-on-surface dark:text-white tracking-tighter text-lg uppercase">{selectedMonth.month_name}</h2>
                                    <button onClick={() => setSelectedMonth(null)} className="md:hidden text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-colors flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[20px]">close</span>
                                    </button>
                                </div>
                                <div className="flex items-center justify-between bg-surface-container-lowest dark:bg-dark-background rounded-xl p-3 border border-outline-variant/50 dark:border-dark-outline/50 shadow-sm">
                                    <div className="flex items-center gap-2.5 flex-1">
                                        <div className="w-8 h-8 rounded-full bg-surface-container dark:bg-dark-surface flex items-center justify-center text-on-surface-variant dark:text-dark-on-surface-variant border border-outline-variant/50 dark:border-dark-outline">
                                            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-on-surface-variant dark:text-dark-on-surface-variant font-black uppercase tracking-widest mb-0.5">Volumen</p>
                                            <p className="text-[11px] font-bold text-on-surface dark:text-white leading-none">{selectedMonth.sales_count} Ventas</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 flex flex-col gap-4">
                                <div className="flex justify-between items-center border-b border-outline-variant/30 dark:border-dark-outline/30 pb-3">
                                    <div>
                                        <p className="text-[10px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest">Venta Bruta</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-on-surface dark:text-white text-sm">${formatMoney(selectedMonth.total_usd)}</p>
                                        <p className="text-[9px] font-bold text-on-surface-variant dark:text-dark-on-surface-variant opacity-70">/ {formatMoney(selectedMonth.total_bs)} Bs</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center border-b border-outline-variant/30 dark:border-dark-outline/30 pb-3">
                                    <div>
                                        <p className="text-[10px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[12px] text-blue-500">inventory_2</span> Fondo Reposición
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-on-surface dark:text-white text-sm">${formatMoney(selectedMonth.total_cost_usd)}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center border-b border-outline-variant/30 dark:border-dark-outline/30 pb-3">
                                    <div>
                                        <p className="text-[10px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[12px] text-indigo-500">domain_add</span> Fondo Reinversión ({business_percentage}%)
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-on-surface dark:text-white text-sm">${formatMoney(selectedMonth.reinvestment_usd)}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center border-b border-outline-variant/30 dark:border-dark-outline/30 pb-3">
                                    <div>
                                        <p className="text-[10px] font-black text-primary dark:text-dark-primary uppercase tracking-widest flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[12px]">account_balance_wallet</span> Ganancia Neta ({profit_percentage}%)
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-primary dark:text-dark-primary text-sm">${formatMoney(selectedMonth.profit_usd)}</p>
                                    </div>
                                </div>

                                {selectedMonth.total_loss_usd > 0 && (
                                    <div className="flex justify-between items-center pb-1 text-error">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">money_off</span> Fugas
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-sm">-${formatMoney(selectedMonth.total_loss_usd)}</p>
                                            <p className="text-[9px] font-bold opacity-70">- {formatMoney(selectedMonth.total_loss_bs)} Bs</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-primary/5 dark:bg-[#111810] p-6 mt-auto">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-xs font-black text-primary dark:text-dark-primary uppercase tracking-widest">Ganancia Neta Final:</span>
                                    <span className="font-display-lg font-black text-primary dark:text-dark-primary text-2xl tracking-tighter">
                                        ${formatMoney(Math.max(0, (selectedMonth.total_usd * profitRatio) - selectedMonth.total_loss_usd))}
                                    </span>
                                </div>
                                <div className="text-right text-[11px] font-black text-on-surface-variant dark:text-dark-on-surface-variant opacity-70">
                                    ~ {formatMoney(Math.max(0, (selectedMonth.total_bs * profitRatio) - selectedMonth.total_loss_bs))} BS
                                </div>
                            </div>
                        </div>

                        {/* RIGHT PANEL - TICKETS */}
                        <div className="flex-1 flex flex-col max-h-[60vh] md:max-h-[80vh] bg-surface-container-lowest dark:bg-dark-background">
                            <div className="px-6 py-4 border-b border-outline-variant/50 dark:border-dark-outline flex justify-between items-center shrink-0">
                                <h3 className="text-[10px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest">Tickets del Mes</h3>
                                <button onClick={() => setSelectedMonth(null)} className="hidden md:flex text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-colors items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>
                            
                            {selectedMonth.sales && selectedMonth.sales.length > 0 ? (
                                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedMonth.sales.map(venta => (
                                            <div key={venta.id} onClick={() => setSelectedSale(venta)} className="bg-surface-container-low dark:bg-dark-surface border border-outline-variant dark:border-dark-outline rounded-xl p-3 flex justify-between items-center shadow-sm hover:border-primary dark:hover:border-dark-primary cursor-pointer hover:bg-surface-container-low/80 dark:hover:bg-neutral-800 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-surface-container dark:bg-dark-background flex items-center justify-center text-primary dark:text-dark-primary shrink-0 border dark:border-dark-outline">
                                                        <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-on-surface dark:text-dark-on-surface uppercase text-[10px] tracking-wider group-hover:text-primary dark:group-hover:text-dark-primary">Ticket #{venta.id}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <p className="text-[9px] text-on-surface-variant dark:text-dark-on-surface-variant font-medium">{formatTime(venta.created_at)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <p className="text-[11px] text-primary dark:text-dark-primary font-black tracking-tight">${formatMoney(venta.total_usd)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center p-6 text-on-surface-variant dark:text-dark-on-surface-variant text-sm font-medium">
                                    No hay tickets para este mes.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DEL TICKET ESPECÍFICO CON DESGLOSE DE GANANCIAS */}
            {selectedSale && (
                <div 
                    className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in transition-all overflow-y-auto"
                    onClick={() => setSelectedSale(null)}
                >
                    <div 
                        className="bg-surface-container-lowest dark:bg-dark-surface w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden border dark:border-dark-outline m-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-5 py-5 border-b border-outline-variant/50 dark:border-dark-outline flex flex-col gap-4 bg-surface-bright dark:bg-dark-surface-container">
                            <div className="flex justify-between items-center">
                                <h2 className="font-headline-sm font-black text-on-surface dark:text-white tracking-tighter text-lg">Ticket #{selectedSale.id}</h2>
                                <button onClick={() => setSelectedSale(null)} className="text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-colors flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>
                            <div className="flex items-center justify-between bg-surface-container-lowest dark:bg-dark-background rounded-xl p-3 border border-outline-variant/50 dark:border-dark-outline/50 shadow-sm">
                                <div className="flex items-center gap-2.5 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-surface-container dark:bg-dark-surface flex items-center justify-center text-on-surface-variant dark:text-dark-on-surface-variant border border-outline-variant/50 dark:border-dark-outline">
                                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-on-surface-variant dark:text-dark-on-surface-variant font-black uppercase tracking-widest mb-0.5">Registro</p>
                                        <p className="text-[11px] font-bold text-on-surface dark:text-white leading-none">{formatTime(selectedSale.created_at)}</p>
                                    </div>
                                </div>
                                <div className="w-px h-6 bg-outline-variant dark:bg-dark-outline mx-2"></div>
                                <div className="flex items-center gap-2.5 flex-1 justify-end text-right">
                                    <div>
                                        <p className="text-[9px] text-on-surface-variant dark:text-dark-on-surface-variant font-black uppercase tracking-widest mb-0.5">Pago</p>
                                        <p className="text-[11px] font-black text-primary dark:text-dark-primary uppercase leading-none">{selectedSale.payment_method}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-dark-primary/10 text-primary dark:text-dark-primary flex items-center justify-center border border-primary/20 dark:border-dark-primary/20 shrink-0">
                                        <span className="material-symbols-outlined text-[16px]">{paymentIcons[selectedSale.payment_method] || 'payments'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 flex flex-col gap-3 max-h-[40vh] overflow-y-auto">
                            <div className="grid grid-cols-12 text-[10px] font-black text-on-surface-variant dark:text-dark-on-surface-variant border-b border-outline-variant/50 dark:border-dark-outline pb-2 mb-2 uppercase tracking-widest">
                                <div className="col-span-2">Cant</div>
                                <div className="col-span-7 pl-1">Producto</div>
                                <div className="col-span-3 text-right">Total</div>
                            </div>
                            {selectedSale.items && selectedSale.items.map(item => {
                                const tasa = selectedSale.tasa_bcv || 1;
                                const precioUsd = (Number(item.price_bs) || 0) / tasa;
                                const totalItemUsd = precioUsd * item.quantity;
                                return (
                                    <div key={item.id} className="grid grid-cols-12 items-center border-b border-outline-variant/30 dark:border-dark-outline/30 pb-3">
                                        <div className="col-span-2 font-black text-on-surface dark:text-dark-primary text-xs">{item.quantity}x</div>
                                        <div className="col-span-7 pr-2">
                                            <p className="font-bold text-body-sm text-on-surface dark:text-dark-on-surface leading-tight">{item.product ? item.product.name : 'Eliminado'}</p>
                                        </div>
                                        <div className="col-span-3 text-right font-black text-on-surface dark:text-white text-xs">${totalItemUsd.toFixed(2)}</div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="bg-surface-container-lowest dark:bg-dark-background p-6 border-t border-outline-variant/50 dark:border-dark-outline mt-auto">

                            {/* Información de Tasa Conservada */}
                            <div className="flex justify-between items-center mb-4 border-b border-outline-variant/30 dark:border-dark-outline/30 pb-2">
                                <span className="text-[9px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest">Tasa del Ticket:</span>
                                <span className="font-bold text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant">{selectedSale.tasa_bcv} Bs</span>
                            </div>

                            {/* Fugas si existen */}
                            {Number(selectedSale.change_loss_bs) > 0 && (
                                <div className="flex justify-between items-center text-error mb-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">money_off</span> Pérdida por Vuelto
                                    </span>
                                    <span className="font-black text-sm">{formatMoney(selectedSale.change_loss_bs)} Bs</span>
                                </div>
                            )}

                            {/* Distribución del Ticket Específico (3 Fondos) */}
                            <div className="grid grid-cols-3 gap-2 mb-4 mt-2">
                                <div className="bg-surface-container-low dark:bg-dark-surface p-2 rounded border border-outline-variant/30 dark:border-dark-outline/50">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Reposición</p>
                                    <p className="font-black text-xs text-on-surface dark:text-white">${formatMoney(selectedSale.cost_usd || 0)}</p>
                                </div>
                                <div className="bg-surface-container-low dark:bg-dark-surface p-2 rounded border border-outline-variant/30 dark:border-dark-outline/50">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Reinversión ({business_percentage}%)</p>
                                    <p className="font-black text-xs text-on-surface dark:text-white">${formatMoney(selectedSale.reinvestment_usd || 0)}</p>
                                </div>
                                <div className="bg-primary/10 dark:bg-dark-primary/10 p-2 rounded border border-primary/20 dark:border-dark-primary/20">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-primary dark:text-dark-primary mb-1">Ganancia ({profit_percentage}%)</p>
                                    <p className="font-black text-xs text-primary dark:text-dark-primary">
                                        ${formatMoney(Math.max(0, (selectedSale.profit_usd || 0) - ((selectedSale.change_loss_bs || 0) / (selectedSale.tasa_bcv || 1))))}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-1 border-t border-outline-variant/30 dark:border-dark-outline/30 pt-3">
                                <span className="text-xs font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest">Total Pagado:</span>
                                <span className="font-display-lg font-black text-primary dark:text-dark-primary text-xl tracking-tighter">${formatMoney(selectedSale.total_usd)}</span>
                            </div>
                            <div className="text-right text-[11px] font-black text-on-surface-variant dark:text-dark-on-surface-variant opacity-70 mb-4">
                                / {formatMoney(selectedSale.total_bs)} BS
                            </div>

                            {/* BOTÓN EDITAR TICKET (SOLO SI EL TICKET PERTENECE A LA JORNADA DE HOY) */}
                            {isSaleFromToday(selectedSale.created_at) && (
                                <button
                                    onClick={() => {
                                        setSelectedSale(null);
                                        router.get(route('pos.index'), { edit_sale_id: selectedSale.id });
                                    }}
                                    className="w-full mt-2 bg-primary/10 text-primary dark:bg-dark-primary/10 dark:text-dark-primary py-2.5 rounded-lg font-black text-xs uppercase tracking-wider flex justify-center items-center gap-2 hover:bg-primary/20 dark:hover:bg-dark-primary/20 transition-all border border-primary/20 dark:border-dark-primary/20 shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[18px]">edit_note</span>
                                    Editar Ticket
                                </button>
                            )}

                        </div>
                    </div>
                </div>
            )}

            {/* SIDEBAR HISTORIAL DE TICKETS (Solo vemos las de hoy aquí) */}
            <div className={`fixed inset-0 z-[110] transition-all duration-300 ${isHistoryOpen ? 'visible' : 'invisible'}`}>
                <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isHistoryOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsHistoryOpen(false)} />
                <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-surface dark:bg-dark-surface shadow-2xl border-l border-outline-variant dark:border-dark-outline transform transition-transform duration-300 flex flex-col ${isHistoryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="p-6 border-b border-outline-variant dark:border-dark-outline flex justify-between items-center bg-surface-container-low dark:bg-dark-background/50">
                        <div>
                            <h3 className="font-headline-sm font-black text-on-surface dark:text-white uppercase tracking-tighter text-lg">Historial de Ventas</h3>
                            <p className="text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant font-bold uppercase tracking-widest">Tickets procesados hoy</p>
                        </div>
                        <button onClick={() => setIsHistoryOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-error/10 text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-all">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-2">
                        {ventasRecientes.map(venta => (
                            <div key={venta.id} onClick={() => setSelectedSale(venta)} className="p-4 rounded-xl border border-outline-variant dark:border-dark-outline bg-surface-container-lowest dark:bg-dark-background/40 flex justify-between items-center cursor-pointer hover:border-primary dark:hover:border-dark-primary hover:shadow-md transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-surface-container dark:bg-dark-surface flex items-center justify-center text-primary dark:text-dark-primary group-hover:scale-110 transition-transform border border-transparent dark:border-dark-outline">
                                        <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-xs text-on-surface dark:text-white uppercase tracking-wider group-hover:text-primary dark:group-hover:text-dark-primary transition-colors">Ticket #{venta.id}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant font-medium">{formatTime(venta.created_at)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="font-black text-sm text-primary dark:text-dark-primary tracking-tight">${formatMoney(venta.total_usd)}</p>
                                    <p className="font-bold text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant opacity-70 mt-0.5">/ {formatMoney(venta.total_bs)} Bs</p>
                                </div>
                            </div>
                        ))}
                        {ventasRecientes.length === 0 && (
                            <div className="text-center p-8 border border-dashed border-outline-variant dark:border-dark-outline rounded-xl bg-surface-container-lowest dark:bg-dark-surface/30">
                                <p className="text-on-surface-variant dark:text-dark-on-surface-variant font-medium text-sm">No hay registros hoy.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}