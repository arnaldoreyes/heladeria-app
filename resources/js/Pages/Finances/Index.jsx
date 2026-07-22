import { Head, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { useState, useEffect } from 'react';

export default function Finances({ analytics, history, global_stats }) {
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
    const [expandedMonth, setExpandedMonth] = useState(null);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                if (selectedSale) setSelectedSale(null);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [selectedSale]);

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

                {/* NUEVO: KPIs GLOBALES HISTÓRICOS (3 FONDOS + INGRESO + FUGAS) */}
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
                            <span className="material-symbols-outlined text-[14px] text-indigo-500">domain_add</span> Reinversión ({business_percentage}%)
                        </p>
                        <p className="text-lg lg:text-xl font-black text-on-surface dark:text-white mt-1">${formatMoney(global_stats.total_reinvestment)}</p>
                    </div>
                    <div className="bg-primary/5 dark:bg-dark-primary/10 p-4 rounded-xl border border-primary/20 dark:border-dark-primary/30 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-dark-primary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span> Ganancia ({profit_percentage}%)
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

                {/* FILA SUPERIOR: DEMANDA Y PRODUCTOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-surface dark:bg-dark-surface border border-outline-variant/50 dark:border-dark-outline rounded-xl p-5 shadow-sm flex flex-col justify-between">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-4 border-b dark:border-dark-outline pb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">insights</span> Comportamiento de Demanda
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow flex items-center">
                            {/* Bloque Día Más Fuerte */}
                            <div className="bg-surface-container-low dark:bg-[#121212]/80 p-4 rounded-xl border border-outline-variant/20 dark:border-dark-outline/40 flex items-center gap-4 w-full">
                                <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-dark-primary/10 flex items-center justify-center text-primary dark:text-dark-primary shrink-0">
                                    <span className="material-symbols-outlined text-[24px]">calendar_month</span>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase font-black tracking-widest text-on-surface-variant">Día Más Fuerte</p>
                                    <p className="text-lg font-black text-on-surface dark:text-white uppercase mt-0.5">{analytics.best_day}</p>
                                </div>
                            </div>

                            {/* Bloque Hora Pico */}
                            <div className="bg-surface-container-low dark:bg-[#121212]/80 p-4 rounded-xl border border-outline-variant/20 dark:border-dark-outline/40 flex items-center gap-4 w-full">
                                <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-dark-primary/10 flex items-center justify-center text-primary dark:text-dark-primary shrink-0">
                                    <span className="material-symbols-outlined text-[24px]">schedule</span>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase font-black tracking-widest text-on-surface-variant">Hora Pico</p>
                                    <p className="text-lg font-black text-on-surface dark:text-white mt-0.5">{format12h(analytics.peak_hour)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface dark:bg-dark-surface border border-outline-variant/50 dark:border-dark-outline rounded-xl p-5 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">stars</span> Top 5 Más Vendidos
                        </h3>
                        <div className="flex flex-col gap-2">
                            {Object.entries(analytics.top_products).length === 0 ? (
                                <p className="text-xs text-on-surface-variant font-bold">Sin datos.</p>
                            ) : (
                                Object.entries(analytics.top_products).map(([name, qty], idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-surface-container-lowest dark:bg-[#121212] px-3 py-1.5 rounded border border-outline-variant/30 dark:border-dark-outline/50">
                                        <span className="text-[10px] font-bold text-on-surface dark:text-white uppercase truncate pr-2">{idx + 1}. {name}</span>
                                        <span className="text-[10px] font-black bg-primary/10 text-primary dark:bg-dark-primary/10 dark:text-dark-primary px-1.5 py-0.5 rounded">{qty} und</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* TABLA HISTÓRICA MENSUAL */}
                <div>
                    <h3 className="text-xs font-black text-on-surface dark:text-white tracking-widest uppercase mb-3 border-l-2 border-primary pl-2">Desglose Mensual Detallado</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        {history.length === 0 ? (
                            <div className="col-span-1 lg:col-span-2 p-8 text-center bg-surface-container-lowest dark:bg-dark-surface border border-dashed border-outline-variant dark:border-dark-outline rounded-xl">
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Sin registros contables.</p>
                            </div>
                        ) : (
                            history.map(month => {
                                const fondoReposicionUsd = month.total_cost_usd || 0;
                                const fondoReinversionUsd = month.reinvestment_usd || 0;
                                const gananciaUsd = Math.max(0, (month.profit_usd || 0) - month.total_loss_usd);

                                // Cálculos para la barra visual (si hay ventas)
                                const totalBars = month.total_sales_usd || 1;
                                const pctCost = (fondoReposicionUsd / totalBars) * 100;
                                const pctReinvestment = (fondoReinversionUsd / totalBars) * 100;
                                const pctProfit = (gananciaUsd / totalBars) * 100;
                                const pctLoss = (month.total_loss_usd / totalBars) * 100;

                                return (
                                    <div key={month.id} className="bg-surface-container-lowest dark:bg-[#111111] border border-outline-variant/50 dark:border-dark-outline rounded-2xl flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow">

                                        {/* CABECERA */}
                                        <div className="p-5 border-b border-outline-variant/30 dark:border-dark-outline bg-surface-bright dark:bg-[#161616] flex justify-between items-center">
                                            <div>
                                                <h4 className="font-headline-sm font-black text-on-surface dark:text-white uppercase tracking-tight text-lg">{month.month_name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-on-surface-variant dark:text-gray-400 uppercase tracking-widest bg-surface-container dark:bg-dark-surface px-2 py-0.5 rounded-full">{month.sales_count} Ventas</span>
                                                    <span className="text-[10px] font-bold text-on-surface-variant dark:text-gray-400 uppercase tracking-widest">Mejor: {month.best_week}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleMonth(month.id)}
                                                className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${expandedMonth === month.id ? 'bg-primary/10 text-primary dark:bg-dark-primary/10 dark:text-dark-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high dark:bg-dark-surface dark:text-dark-on-surface-variant dark:hover:bg-dark-surface-container'}`}
                                                title="Ver Tickets"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {expandedMonth === month.id ? 'expand_less' : 'receipt_long'}
                                                </span>
                                            </button>
                                        </div>

                                        {/* DATOS FINANCIEROS (3 FONDOS DESGLOSADOS) */}
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
                                                <p className="text-[9px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[12px] text-indigo-500">domain_add</span> Reinversión ({business_percentage}%)</p>
                                                <p className="font-black text-base lg:text-lg text-on-surface dark:text-gray-200 leading-none">${formatMoney(fondoReinversionUsd)}</p>
                                            </div>
                                            <div className="bg-primary/5 dark:bg-dark-primary/10 p-2 rounded-lg border border-primary/10 dark:border-dark-primary/20">
                                                <p className="text-[9px] font-black text-primary dark:text-dark-primary uppercase tracking-widest mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">account_balance_wallet</span> Ganancia</p>
                                                <p className="font-black text-base lg:text-lg text-primary dark:text-dark-primary leading-none">${formatMoney(gananciaUsd)}</p>
                                            </div>
                                            {month.total_loss_usd > 0 && (
                                                <div className="col-span-3 pt-2 flex items-center justify-between border-t border-outline-variant/20 dark:border-dark-outline/30">
                                                    <p className="text-[10px] font-black text-error uppercase tracking-widest flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">money_off</span> Pérdidas por Fuga</p>
                                                    <p className="font-black text-sm text-error">-${formatMoney(month.total_loss_usd)} <span className="text-[10px] opacity-80">({month.loss_percentage.toFixed(1)}%)</span></p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Barra visual de distribución del dinero */}
                                        {month.total_sales_usd > 0 && (
                                            <div className="h-1.5 w-full flex bg-surface-container-highest dark:bg-dark-outline mt-auto">
                                                <div style={{ width: `${pctCost}%` }} className="bg-blue-500" title="Reposición"></div>
                                                <div style={{ width: `${pctReinvestment}%` }} className="bg-indigo-500" title="Reinversión"></div>
                                                <div style={{ width: `${pctProfit}%` }} className="bg-primary dark:bg-dark-primary" title="Ganancia"></div>
                                                <div style={{ width: `${pctLoss}%` }} className="bg-error" title="Fuga"></div>
                                            </div>
                                        )}

                                        {/* EXPANDED TICKETS LIST */}
                                        {expandedMonth === month.id && month.sales && month.sales.length > 0 && (
                                            <div className="p-4 bg-surface-container-lowest dark:bg-dark-background border-t border-outline-variant/50 dark:border-dark-outline animate-fade-in">
                                                <h3 className="text-[10px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest mb-3">Listado de Tickets</h3>
                                                <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                                    {month.sales.map(venta => (
                                                        <div key={venta.id} onClick={() => setSelectedSale(venta)} className="bg-surface-container-low dark:bg-dark-surface border border-outline-variant dark:border-dark-outline rounded-xl p-3 flex justify-between items-center shadow-sm hover:border-primary dark:hover:border-dark-primary cursor-pointer transition-all group">
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
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </main>

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
                                    <span className="font-black text-sm">{formatMoney(selectedSale.change_loss_bs / selectedSale.tasa_bcv)} USD</span>
                                </div>
                            )}

                            {/* Distribución del Ticket Específico */}
                            <div className="grid grid-cols-2 gap-4 mb-4 mt-2">
                                <div className="bg-surface-container-low dark:bg-dark-surface p-2 rounded border border-outline-variant/30 dark:border-dark-outline/50">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Negocio ({business_percentage}%)</p>
                                    <p className="font-black text-xs text-on-surface dark:text-white">${formatMoney(selectedSale.total_usd * businessRatio)}</p>
                                </div>
                                <div className="bg-primary/10 dark:bg-dark-primary/10 p-2 rounded border border-primary/20 dark:border-dark-primary/20">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-primary dark:text-dark-primary mb-1">Ganancia ({profit_percentage}%)</p>
                                    <p className="font-black text-xs text-primary dark:text-dark-primary">${formatMoney(selectedSale.total_usd * profitRatio)}</p>
                                </div>
                            </div>

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
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}