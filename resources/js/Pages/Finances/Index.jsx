import { Head, usePage, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { useState, useEffect } from 'react';

export default function Finances({ analytics, history, global_stats, current_week_volume }) {
    const { profit_percentage, business_percentage } = usePage().props;
    const profitRatio = (profit_percentage || 30) / 100;
    const businessRatio = (business_percentage || 70) / 100;

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
    };

    const format12h = (time24) => {
        if (!time24 || time24 === 'N/A') return 'N/A';
        const parts = time24.split(':');
        const hour24 = parseInt(parts[0], 10);
        const ampm = hour24 >= 12 ? 'pm' : 'am';
        const hour12 = hour24 % 12 || 12;
        return `${hour12}:${parts[1]} ${ampm}`;
    };
    const [selectedSale, setSelectedSale] = useState(null);
    const [selectedRestock, setSelectedRestock] = useState(null);
    const [saleToDelete, setSaleToDelete] = useState(null);
    const [toast, setToast] = useState('');
    const [expandedMonth, setExpandedMonth] = useState(null);
    const [openAccordions, setOpenAccordions] = useState({});

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const toggleAccordion = (key) => {
        setOpenAccordions(prev => ({ ...prev, [key]: prev[key] === undefined ? true : !prev[key] }));
    };

    const formatDateFull = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                if (saleToDelete) setSaleToDelete(null);
                else if (selectedRestock) setSelectedRestock(null);
                else if (selectedSale) setSelectedSale(null);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [saleToDelete, selectedRestock, selectedSale]);

    const paymentIcons = {
        'Punto de Venta': 'credit_card',
        'Pago Móvil': 'phone_iphone',
        'Efectivo Bs': 'payments',
        'Efectivo Divisas': 'attach_money',
        'Zelle': 'account_balance',
        'Transferencia': 'account_balance'
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    };

    const toggleMonth = (monthId) => {
        if (expandedMonth === monthId) {
            setExpandedMonth(null);
        } else {
            setExpandedMonth(monthId);
        }
    };
    return (
        <MainLayout>
            <Head title="Analítica Financiera" />
            <main className="pt-8 px-4 md:px-8 max-w-7xl mx-auto flex flex-col gap-6 pb-20">

                <div className="border-b border-outline-variant/30 dark:border-dark-outline pb-3">
                    <h1 className="font-headline-sm text-xl font-black tracking-tight text-on-surface dark:text-white uppercase">
                        Analítica Financiera
                    </h1>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-surface-container-low dark:bg-[#111111] p-4 rounded-xl border border-outline-variant/30 dark:border-dark-outline shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">monetization_on</span> Ingreso Total
                        </p>
                        <p className="text-lg lg:text-xl font-black text-on-surface dark:text-white mt-1">${formatMoney(global_stats.total_gross)}</p>
                    </div>
                    <div className="bg-surface-container-low dark:bg-[#111111] p-4 rounded-xl border border-outline-variant/30 dark:border-dark-outline shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-blue-500">inventory_2</span> Reposición
                        </p>
                        <p className="text-lg lg:text-xl font-black text-on-surface dark:text-white mt-1">${formatMoney(global_stats.total_cost)}</p>
                    </div>
                    <div className="bg-surface-container-low dark:bg-[#111111] p-4 rounded-xl border border-outline-variant/30 dark:border-dark-outline shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-indigo-500">domain_add</span> Reinversión
                        </p>
                        <p className="text-lg lg:text-xl font-black text-on-surface dark:text-white mt-1">${formatMoney(global_stats.total_reinvestment)}</p>
                    </div>
                    <div className="bg-primary/5 dark:bg-dark-primary/10 p-4 rounded-xl border border-primary/20 dark:border-dark-primary/30 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-dark-primary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span> Ganancia
                        </p>
                        <p className="text-lg lg:text-xl font-black text-primary dark:text-dark-primary mt-1">${formatMoney(Math.max(0, (global_stats.total_profit || 0) - global_stats.total_loss))}</p>
                    </div>
                    <div className="bg-surface-container-low dark:bg-[#111111] p-4 rounded-xl border border-error/30 dark:border-error/30 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-error"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-error flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">money_off</span> Fugas
                        </p>
                        <p className="text-lg lg:text-xl font-black text-error mt-1">-${formatMoney(global_stats.total_loss)}</p>
                    </div>
                </div>

                {/* SECCIÓN SUPERIOR: VOLUMEN DE LA SEMANA ACTUAL + TOP 5 PRODUCTOS MÁS VENDIDOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* TARJETA 1: VOLUMEN SEMANAL (SEMANA CORRIENDO) */}
                    <div className="bg-surface-container-lowest dark:bg-dark-surface border border-outline-variant/50 dark:border-dark-outline rounded-xl p-5 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b dark:border-dark-outline pb-3 mb-3">
                            <h3 className="text-xs font-black text-primary dark:text-dark-primary uppercase tracking-widest flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[18px]">equalizer</span>
                                Volumen Semanal (Semana Actual)
                            </h3>
                            <span className="text-[10px] font-black bg-primary/10 text-primary dark:bg-dark-primary/10 dark:text-dark-primary px-2.5 py-1 rounded-md uppercase tracking-wider">
                                {current_week_volume?.label || 'Semana Actual'}
                            </span>
                        </div>

                        {current_week_volume?.products && current_week_volume.products.length > 0 ? (
                            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                                {current_week_volume.products.map((p, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-surface-container-low dark:bg-dark-background p-2.5 rounded-lg border border-outline-variant/30 dark:border-dark-outline/50">
                                        <span className="text-xs font-bold text-on-surface dark:text-gray-200 truncate pr-2">{p.product_name}</span>
                                        <span className="text-xs font-black text-primary dark:text-dark-primary bg-primary/10 dark:bg-dark-primary/10 px-2 py-0.5 rounded">{p.total_units} u</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-on-surface-variant italic py-4 text-center">No hay registros de ventas en la semana corriendo.</p>
                        )}
                    </div>

                    {/* TARJETA 2: TOP 5 PRODUCTOS MÁS VENDIDOS */}
                    <div className="bg-surface-container-lowest dark:bg-dark-surface border border-outline-variant/50 dark:border-dark-outline rounded-xl p-5 shadow-sm">
                        <h3 className="text-xs font-black text-primary dark:text-dark-primary uppercase tracking-widest mb-3 border-b dark:border-dark-outline pb-3 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[18px]">stars</span>
                            Top 5 Productos Más Vendidos
                        </h3>
                        <div className="flex flex-col gap-2">
                            {analytics?.top_products && Object.entries(analytics.top_products).length === 0 ? (
                                <p className="text-xs text-on-surface-variant font-bold italic py-4 text-center">Sin datos de productos.</p>
                            ) : (
                                Object.entries(analytics?.top_products || {}).map(([name, qty], idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-surface-container-low dark:bg-dark-background p-2.5 rounded-lg border border-outline-variant/30 dark:border-dark-outline/50">
                                        <span className="text-xs font-bold text-on-surface dark:text-white uppercase truncate pr-2">{idx + 1}. {name}</span>
                                        <span className="text-xs font-black bg-primary/10 text-primary dark:bg-dark-primary/10 dark:text-dark-primary px-2 py-0.5 rounded">{qty} und</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* TABLA HISTÓRICA MENSUAL (1 COLUMNA ANCHO COMPLETO - FULL WIDTH) */}
                <div>
                    <h3 className="text-xs font-black text-on-surface dark:text-white tracking-widest uppercase mb-3 border-l-2 border-primary pl-2">
                        Desglose Mensual Detallado
                    </h3>
                    <div className="flex flex-col gap-4 w-full">
                        {history.length === 0 ? (
                            <div className="w-full p-8 text-center bg-surface-container-lowest dark:bg-dark-surface border border-dashed border-outline-variant dark:border-dark-outline rounded-xl">
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Sin registros contables.</p>
                            </div>
                        ) : (
                            history.map(month => {
                                const fondoReposicionUsd = month.total_cost_usd || 0;
                                const fondoReinversionUsd = month.reinvestment_usd || 0;
                                const gananciaUsd = Math.max(0, (month.profit_usd || 0) - month.total_loss_usd);

                                const isWeeklyOpen = !!openAccordions[`${month.id}-weekly`];
                                const isSalesOpen = openAccordions[`${month.id}-sales`] !== false;
                                const isRestocksOpen = !!openAccordions[`${month.id}-restocks`];

                                return (
                                    <div key={month.id} className="w-full bg-surface-container-lowest dark:bg-[#111111] border border-outline-variant/50 dark:border-dark-outline rounded-2xl flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow">

                                        {/* CABECERA DE LA TARJETA DEL MES */}
                                        <div className="p-5 border-b border-outline-variant/30 dark:border-dark-outline bg-surface-bright dark:bg-[#161616] flex justify-between items-center">
                                            <div>
                                                <h4 className="font-headline-sm font-black text-on-surface dark:text-white uppercase tracking-tight text-lg">{month.month_name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-on-surface-variant dark:text-gray-400 uppercase tracking-widest bg-surface-container dark:bg-dark-surface px-2 py-0.5 rounded-full">{month.sales_count} Ventas</span>
                                                    <span className="text-[10px] font-bold text-on-surface-variant dark:text-gray-400 uppercase tracking-widest bg-surface-container dark:bg-dark-surface px-2 py-0.5 rounded-full">{month.restock_count || 0} Reposiciones</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleMonth(month.id)}
                                                className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${expandedMonth === month.id ? 'bg-primary/10 text-primary dark:bg-dark-primary/10 dark:text-dark-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high dark:bg-dark-surface dark:text-dark-on-surface-variant dark:hover:bg-dark-surface-container'}`}
                                                title="Ver Detalle Mensual"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {expandedMonth === month.id ? 'expand_less' : 'expand_more'}
                                                </span>
                                            </button>
                                        </div>

                                        {/* DATOS FINANCIEROS CONSOLIDADOS */}
                                        <div className="p-5 grid grid-cols-3 gap-y-4 gap-x-3">
                                            <div className="col-span-3 pb-2 border-b border-outline-variant/20 dark:border-dark-outline/30 flex justify-between items-center">
                                                <div>
                                                    <p className="text-[10px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">monetization_on</span> Ingreso Bruto</p>
                                                    <p className="font-black text-xl lg:text-2xl text-on-surface dark:text-white leading-none mt-1">${formatMoney(month.total_sales_usd)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-on-surface-variant dark:text-dark-on-surface-variant">Ticket Promedio: ${formatMoney(month.average_ticket)}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[12px] text-blue-500">inventory_2</span> Reposición</p>
                                                <p className="font-black text-base lg:text-lg text-on-surface dark:text-gray-200 leading-none">${formatMoney(fondoReposicionUsd)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[12px] text-indigo-500">domain_add</span> Reinversión </p>
                                                <p className="font-black text-base lg:text-lg text-on-surface dark:text-gray-200 leading-none">${formatMoney(fondoReinversionUsd)}</p>
                                            </div>
                                            <div className="bg-primary/5 dark:bg-dark-primary/10 p-2 rounded-lg border border-primary/10 dark:border-dark-primary/20">
                                                <p className="text-[9px] font-black text-primary dark:text-dark-primary uppercase tracking-widest mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">account_balance_wallet</span> Ganancia</p>
                                                <p className="font-black text-base lg:text-lg text-primary dark:text-dark-primary leading-none">${formatMoney(gananciaUsd)}</p>
                                            </div>
                                            {month.total_loss_usd > 0 && (
                                                <div className="col-span-3 pt-2 flex items-center justify-between border-t border-outline-variant/20 dark:border-dark-outline/30">
                                                    <p className="text-[10px] font-black text-error uppercase tracking-widest flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">money_off</span> Pérdidas por Fuga</p>
                                                    <p className="font-black text-sm text-error">-${formatMoney(month.total_loss_usd)} ({month.loss_percentage.toFixed(1)}%)</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* DESGLOSE DESPLEGABLE CON ACORDEONES INTERNOS */}
                                        {expandedMonth === month.id && (
                                            <div className="p-4 sm:p-5 bg-surface-container-lowest dark:bg-dark-background border-t border-outline-variant/50 dark:border-dark-outline animate-fade-in flex flex-col gap-4">
                                                
                                                {/* ACORDEÓN 1: HISTÓRICO DE SEMANAS POR MES (VOLUMEN SEMANAL) */}
                                                {month.weekly_volume && Object.keys(month.weekly_volume).length > 0 && (
                                                    <div className="bg-surface-container-low dark:bg-dark-surface rounded-xl border border-outline-variant/40 dark:border-dark-outline overflow-hidden">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleAccordion(`${month.id}-weekly`)}
                                                            className="w-full p-3.5 flex justify-between items-center text-xs font-black uppercase tracking-wider text-primary dark:text-dark-primary bg-primary/5 dark:bg-dark-primary/5 hover:bg-primary/10 transition-colors"
                                                        >
                                                            <span className="flex items-center gap-1.5">
                                                                <span className="material-symbols-outlined text-[16px]">equalizer</span>
                                                                Histórico de Semanas ({month.month_name})
                                                            </span>
                                                            <span className="material-symbols-outlined text-[18px]">
                                                                {isWeeklyOpen ? 'expand_less' : 'expand_more'}
                                                            </span>
                                                        </button>

                                                        {isWeeklyOpen && (
                                                            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 border-t border-outline-variant/30 dark:border-dark-outline/40">
                                                                {Object.entries(month.weekly_volume).map(([semana, prods]) => (
                                                                    <div key={semana} className="bg-surface-container-lowest dark:bg-dark-background p-3 rounded-lg border border-outline-variant/30 dark:border-dark-outline/50">
                                                                        <p className="text-[10px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest border-b dark:border-dark-outline/30 pb-1 mb-2 flex justify-between items-center">
                                                                            <span>{semana}</span>
                                                                            <span className="text-primary dark:text-dark-primary font-black bg-primary/10 dark:bg-dark-primary/10 px-1.5 py-0.5 rounded">{prods.reduce((s, p) => s + p.total_units, 0)} u</span>
                                                                        </p>
                                                                        <div className="flex flex-col gap-1">
                                                                            {prods.map((p, idx) => (
                                                                                <div key={idx} className="flex justify-between items-center text-xs">
                                                                                    <span className="font-bold text-on-surface dark:text-gray-200 truncate pr-2">{p.product_name}</span>
                                                                                    <span className="font-black text-primary dark:text-dark-primary text-[10px]">{p.total_units} u</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* ACORDEÓN 2: LISTADO DE TICKETS DE VENTAS */}
                                                <div className="bg-surface-container-low dark:bg-dark-surface rounded-xl border border-outline-variant/40 dark:border-dark-outline overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleAccordion(`${month.id}-sales`)}
                                                        className="w-full p-3.5 flex justify-between items-center text-xs font-black uppercase tracking-wider text-on-surface dark:text-white hover:bg-surface-container-high transition-colors"
                                                    >
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                                                            Tickets de Ventas ({month.sales_count})
                                                        </span>
                                                        <span className="material-symbols-outlined text-[18px]">
                                                            {isSalesOpen ? 'expand_less' : 'expand_more'}
                                                        </span>
                                                    </button>

                                                    {isSalesOpen && (
                                                        <div className="p-3 border-t border-outline-variant/30 dark:border-dark-outline/40">
                                                            {month.sales && month.sales.length > 0 ? (
                                                                <div className="flex flex-col gap-2 max-h-[35vh] overflow-y-auto pr-1 custom-scrollbar">
                                                                    {month.sales.map(venta => (
                                                                        <div key={venta.id} onClick={() => setSelectedSale(venta)} className="bg-surface-container-lowest dark:bg-dark-background border border-outline-variant/40 dark:border-dark-outline rounded-xl p-3 flex justify-between items-center shadow-sm hover:border-primary cursor-pointer transition-all group">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-8 h-8 rounded-lg bg-surface-container dark:bg-dark-surface flex items-center justify-center text-primary dark:text-dark-primary shrink-0 border dark:border-dark-outline">
                                                                                    <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-bold text-on-surface dark:text-dark-on-surface uppercase text-[10px] tracking-wider group-hover:text-primary">Ticket {venta.transaction_code || `#${venta.id}`}</p>
                                                                                    <p className="text-[9px] text-on-surface-variant dark:text-dark-on-surface-variant font-medium mt-0.5">{formatTime(venta.created_at)}</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <p className="text-[11px] text-primary dark:text-dark-primary font-black tracking-tight">${formatMoney(venta.total_usd)}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-on-surface-variant italic p-2">No hay tickets de venta en este periodo.</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* ACORDEÓN 3: FACTURAS DE REPOSICIÓN DE INVENTARIO */}
                                                <div className="bg-surface-container-low dark:bg-dark-surface rounded-xl border border-outline-variant/40 dark:border-dark-outline overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleAccordion(`${month.id}-restocks`)}
                                                        className="w-full p-3.5 flex justify-between items-center text-xs font-black uppercase tracking-wider text-blue-500 hover:bg-blue-500/5 transition-colors"
                                                    >
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                                                            Facturas de Reposición ({month.restock_count || 0})
                                                        </span>
                                                        <span className="material-symbols-outlined text-[18px]">
                                                            {isRestocksOpen ? 'expand_less' : 'expand_more'}
                                                        </span>
                                                    </button>

                                                    {isRestocksOpen && (
                                                        <div className="p-3 border-t border-outline-variant/30 dark:border-dark-outline/40">
                                                            {month.restocks && month.restocks.length > 0 ? (
                                                                <div className="flex flex-col gap-2 max-h-[35vh] overflow-y-auto pr-1 custom-scrollbar">
                                                                    {month.restocks.map(res => (
                                                                        <div
                                                                            key={res.id}
                                                                            onClick={() => setSelectedRestock(res)}
                                                                            className="bg-surface-container-lowest dark:bg-dark-background border border-outline-variant/40 dark:border-dark-outline rounded-xl p-3 flex justify-between items-center shadow-sm hover:border-blue-500 cursor-pointer transition-all group"
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20">
                                                                                    <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-bold text-on-surface dark:text-dark-on-surface uppercase text-[10px] tracking-wider group-hover:text-blue-500">Factura {formatDateFull(res.created_at)}</p>
                                                                                    <p className="text-[9px] text-on-surface-variant dark:text-dark-on-surface-variant font-medium mt-0.5">{formatTime(res.created_at)} • {res.items ? res.items.length : 0} productos</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <p className="text-[11px] text-blue-500 font-black tracking-tight">${formatMoney(res.total_usd)}</p>
                                                                                <p className="text-[9px] font-bold text-on-surface-variant dark:text-dark-on-surface-variant opacity-70">~ {formatMoney(res.total_bs)} Bs</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-on-surface-variant italic p-2">No hay facturas de reposición en este periodo.</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>              </main>

            {/* MODAL DEL TICKET ESPECÍFICO CON DESGLOSE DE GANANCIAS */}
            {selectedSale && (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in transition-all overflow-y-auto"
                    onClick={() => setSelectedSale(null)}
                >
                    <div
                        className="bg-surface-container-lowest dark:bg-dark-surface w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden border dark:border-dark-outline m-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-5 py-5 border-b border-outline-variant/50 dark:border-dark-outline flex flex-col gap-4 bg-surface-bright dark:bg-dark-surface-container">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="font-headline-sm font-black text-on-surface dark:text-white tracking-tighter text-lg">Ticket {selectedSale.transaction_code || `#${selectedSale.id}`}</h2>
                                    <p className="text-[9px] font-bold text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest">ID Registro: #{selectedSale.id}</p>
                                </div>
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
                                    <span className="font-black text-sm">{formatMoney(selectedSale.change_loss_bs / selectedSale.tasa_bcv)} USD</span>
                                </div>
                            )}

                            {/* Distribución del Ticket Específico (3 Fondos en USD y Bs) */}
                            {(() => {
                                const tasa = Number(selectedSale.tasa_bcv || 1);
                                const costUsd = Number(selectedSale.cost_usd || 0);
                                const costBs = costUsd * tasa;
                                const reinvestmentUsd = Number(selectedSale.reinvestment_usd || 0);
                                const reinvestmentBs = reinvestmentUsd * tasa;
                                const changeLossUsd = Number(selectedSale.change_loss_bs || 0) > 0 ? Number(selectedSale.change_loss_bs) / tasa : 0;
                                const profitUsd = Math.max(0, Number(selectedSale.profit_usd || 0) - changeLossUsd);
                                const profitBs = profitUsd * tasa;

                                return (
                                    <div className="grid grid-cols-3 gap-2 mb-4 mt-2">
                                        <div className="bg-surface-container-low dark:bg-dark-surface p-2 rounded border border-outline-variant/30 dark:border-dark-outline/50">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Reposición</p>
                                            <p className="font-black text-xs text-on-surface dark:text-white">${formatMoney(costUsd)}</p>
                                            <p className="text-[9px] font-bold text-on-surface-variant dark:text-dark-on-surface-variant opacity-80 mt-0.5">~ {formatMoney(costBs)} Bs</p>
                                        </div>
                                        <div className="bg-surface-container-low dark:bg-dark-surface p-2 rounded border border-outline-variant/30 dark:border-dark-outline/50">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Reinversión</p>
                                            <p className="font-black text-xs text-on-surface dark:text-white">${formatMoney(reinvestmentUsd)}</p>
                                            <p className="text-[9px] font-bold text-on-surface-variant dark:text-dark-on-surface-variant opacity-80 mt-0.5">~ {formatMoney(reinvestmentBs)} Bs</p>
                                        </div>
                                        <div className="bg-primary/10 dark:bg-dark-primary/10 p-2 rounded border border-primary/20 dark:border-dark-primary/20">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-primary dark:text-dark-primary mb-1">Ganancia</p>
                                            <p className="font-black text-xs text-primary dark:text-dark-primary">${formatMoney(profitUsd)}</p>
                                            <p className="text-[9px] font-bold text-primary/80 dark:text-dark-primary/80 mt-0.5">~ {formatMoney(profitBs)} Bs</p>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest">Total del Ticket:</span>
                                <div className="text-right">
                                    <span className="font-display-lg font-black text-on-surface dark:text-white text-xl tracking-tighter">
                                        ${formatMoney(selectedSale.total_usd)}
                                    </span>
                                    <div className="text-[10px] font-black text-on-surface-variant dark:text-dark-on-surface-variant opacity-70">
                                        / {formatMoney(selectedSale.total_bs)} BS
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSaleToDelete(selectedSale)}
                                className="w-full mt-3 bg-error/10 text-error py-2 rounded-lg font-black text-xs uppercase tracking-wider flex justify-center items-center gap-1 hover:bg-error/20 transition-all border border-error/20 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                Eliminar Ticket
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE DETALLE DE FACTURA DE REPOSICIÓN */}
            {selectedRestock && (
                <div
                    className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in transition-all overflow-y-auto"
                    onClick={() => setSelectedRestock(null)}
                >
                    <div
                        className="bg-surface-container-lowest dark:bg-dark-surface w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden border dark:border-dark-outline m-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-5 py-5 border-b border-outline-variant/50 dark:border-dark-outline flex flex-col gap-2 bg-surface-bright dark:bg-dark-surface-container">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="font-headline-sm font-black text-on-surface dark:text-white tracking-tighter text-lg uppercase">
                                        Factura {formatDateFull(selectedRestock.created_at)}
                                    </h2>
                                    <p className="text-[9px] font-bold text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest mt-0.5">
                                        Código: {selectedRestock.transaction_code || `#${selectedRestock.id}`}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedRestock(null)} className="text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-colors flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 flex flex-col gap-3 max-h-[45vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-12 text-[10px] font-black text-on-surface-variant dark:text-dark-on-surface-variant border-b border-outline-variant/50 dark:border-dark-outline pb-2 mb-2 uppercase tracking-widest">
                                <div className="col-span-2">Cant</div>
                                <div className="col-span-7 pl-1">Producto</div>
                                <div className="col-span-3 text-right">Subtotal</div>
                            </div>
                            {selectedRestock.items && selectedRestock.items.map(item => {
                                const costUsd = Number(item.cost_usd) || 0;
                                const subtotalUsd = costUsd * item.quantity;
                                return (
                                    <div key={item.id} className="grid grid-cols-12 items-center border-b border-outline-variant/30 dark:border-dark-outline/30 pb-3">
                                        <div className="col-span-2 font-black text-blue-500 text-xs">{item.quantity}x</div>
                                        <div className="col-span-7 pr-2">
                                            <p className="font-bold text-xs text-on-surface dark:text-dark-on-surface leading-tight">{item.product ? item.product.name : 'Producto Desconocido'}</p>
                                            <p className="text-[9px] font-bold text-on-surface-variant opacity-70">${formatMoney(costUsd)} c/u</p>
                                        </div>
                                        <div className="col-span-3 text-right font-black text-on-surface dark:text-white text-xs">${formatMoney(subtotalUsd)}</div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="bg-surface-container-lowest dark:bg-dark-background p-6 border-t border-outline-variant/50 dark:border-dark-outline mt-auto">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest">Total Reposición:</span>
                                <div className="text-right">
                                    <span className="font-display-lg font-black text-blue-500 text-xl tracking-tighter">
                                        ${formatMoney(selectedRestock.total_usd)}
                                    </span>
                                    <div className="text-[10px] font-black text-on-surface-variant dark:text-dark-on-surface-variant opacity-70">
                                        / {formatMoney(selectedRestock.total_bs)} BS
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PERSONALIZADO DE CONFIRMACIÓN PARA ELIMINAR TICKET */}
            {saleToDelete && (
                <div
                    className="fixed inset-0 z-[140] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in transition-all"
                    onClick={() => setSaleToDelete(null)}
                >
                    <div
                        className="bg-surface-container-lowest dark:bg-dark-surface w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-4 border dark:border-dark-outline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 text-error">
                            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0 border border-error/20">
                                <span className="material-symbols-outlined text-[22px]">warning</span>
                            </div>
                            <div>
                                <h3 className="font-black text-base text-on-surface dark:text-white">¿Eliminar Ticket?</h3>
                                <p className="text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-wider font-bold">Esta acción revertirá el stock</p>
                            </div>
                        </div>

                        <p className="text-xs text-on-surface-variant dark:text-gray-300 leading-relaxed bg-surface-container-low dark:bg-dark-background p-3 rounded-xl border border-outline-variant/30 dark:border-dark-outline">
                            Se eliminará el ticket <strong className="text-on-surface dark:text-white font-black">{saleToDelete.transaction_code || `#${saleToDelete.id}`}</strong> y se incrementará automáticamente el inventario.
                        </p>

                        <div className="flex gap-2 justify-end mt-2">
                            <button
                                type="button"
                                onClick={() => setSaleToDelete(null)}
                                className="px-4 py-2 rounded-lg border border-outline-variant dark:border-dark-outline text-xs font-black uppercase text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const sId = saleToDelete.id;
                                    setSaleToDelete(null);
                                    setSelectedSale(null);
                                    router.delete(route('sales.destroy', sId), {
                                        preserveScroll: true,
                                        onSuccess: () => showToast('Ticket eliminado correctamente'),
                                    });
                                }}
                                className="px-4 py-2 rounded-lg bg-error text-white text-xs font-black uppercase shadow-md hover:opacity-90 flex items-center gap-1 transition-all"
                            >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST DE NOTIFICACIÓN CUSTOM */}
            {toast && (
                <div className="fixed top-20 right-4 bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background px-6 py-3 rounded-xl shadow-2xl z-[200] font-black animate-fade-in flex items-center gap-2 border border-primary/30">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span className="text-xs uppercase tracking-widest">{toast}</span>
                </div>
            )}
        </MainLayout>
    );
}