import { Head, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

export default function Finances({ analytics, history, global_stats }) {
    const { profit_percentage, business_percentage } = usePage().props;
    const profitRatio = (profit_percentage || 30) / 100;
    const businessRatio = (business_percentage || 70) / 100;

    const formatMoney = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

    return (
        <MainLayout>
            <Head title="Analítica Financiera" />
            <main className="pt-8 px-4 md:px-8 max-w-7xl mx-auto flex flex-col gap-6 pb-20">
                
                <div className="border-b border-outline-variant/30 dark:border-dark-outline pb-3">
                    <h1 className="font-headline-sm text-xl font-black tracking-tight text-on-surface dark:text-white uppercase">
                        Analítica Financiera
                    </h1>
                </div>

                {/* NUEVO: KPIs GLOBALES HISTÓRICOS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-surface-container-low dark:bg-[#111111] p-4 rounded-xl border border-outline-variant/30 dark:border-dark-outline shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">account_balance</span> Ingreso Total
                        </p>
                        <p className="text-2xl font-black text-on-surface dark:text-white mt-1">{formatMoney(global_stats.total_gross)}</p>
                    </div>
                    <div className="bg-surface-container-low dark:bg-[#111111] p-4 rounded-xl border border-outline-variant/30 dark:border-dark-outline shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">inventory</span> Total Reposición
                        </p>
                        <p className="text-2xl font-black text-on-surface dark:text-white mt-1">{formatMoney(global_stats.total_restock)}</p>
                    </div>
                    <div className="bg-surface-container-low dark:bg-[#111111] p-4 rounded-xl border border-error/30 dark:border-error/30 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-error"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-error flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">trending_down</span> Fuga Cambiaria
                        </p>
                        <p className="text-2xl font-black text-error mt-1">-{formatMoney(global_stats.total_loss)}</p>
                    </div>
                    <div className="bg-surface-container-low dark:bg-[#111111] p-4 rounded-xl border border-outline-variant/30 dark:border-dark-outline shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">receipt_long</span> Ticket Promedio
                        </p>
                        <p className="text-2xl font-black text-primary dark:text-dark-primary mt-1">{formatMoney(global_stats.average_ticket)}</p>
                    </div>
                </div>

                {/* FILA SUPERIOR: DEMANDA Y PRODUCTOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-surface dark:bg-dark-surface border border-outline-variant/50 dark:border-dark-outline rounded-xl p-5 shadow-sm flex flex-col justify-center">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-4 border-b dark:border-dark-outline pb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">insights</span> Comportamiento de Demanda
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-on-surface-variant">Día Más Fuerte</p>
                                <p className="text-xl font-black text-primary dark:text-dark-primary mt-1 uppercase">{analytics.best_day}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-on-surface-variant">Hora Pico</p>
                                <p className="text-xl font-black text-primary dark:text-dark-primary mt-1">{analytics.peak_hour}</p>
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
                    <div className="flex flex-col gap-4">
                        {history.length === 0 ? (
                            <div className="p-8 text-center bg-surface-container-lowest dark:bg-dark-surface border border-dashed border-outline-variant dark:border-dark-outline rounded-xl">
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Sin registros contables.</p>
                            </div>
                        ) : (
                            history.map(month => {
                                const fondoUsd = month.total_sales_usd * businessRatio;
                                const gananciaUsd = Math.max(0, (month.total_sales_usd * profitRatio) - month.total_loss_usd);
                                // Caja Real: Lo que queda en el negocio después de reponer inventario
                                const cajaReal = fondoUsd - month.total_restock_usd;

                                // Cálculos para la barra visual (si hay ventas)
                                const totalBars = month.total_sales_usd || 1;
                                const pctBusiness = (fondoUsd / totalBars) * 100;
                                const pctProfit = (gananciaUsd / totalBars) * 100;
                                const pctLoss = (month.total_loss_usd / totalBars) * 100;

                                return (
                                    <div key={month.id} className="bg-surface dark:bg-[#111111] border border-outline-variant/50 dark:border-dark-outline rounded-xl flex flex-col overflow-hidden shadow-sm">
                                        
                                        <div className="flex flex-col md:flex-row">
                                            {/* Cabecera del Mes */}
                                            <div className="bg-surface-container-low dark:bg-[#0a0a0a] p-4 flex flex-row md:flex-col justify-between items-center md:justify-center md:w-32 shrink-0 border-b md:border-b-0 md:border-r dark:border-dark-outline relative">
                                                <span className="font-black text-sm uppercase text-on-surface dark:text-white text-center leading-tight">{month.month_name}</span>
                                                <div className="text-center mt-2">
                                                    <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest bg-white dark:bg-dark-surface px-1.5 py-0.5 rounded block mb-1">Mejor: {month.best_week}</span>
                                                    <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest block">{month.sales_count} Ventas</span>
                                                </div>
                                            </div>

                                            {/* Datos Financieros */}
                                            <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
                                                <div>
                                                    <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">point_of_sale</span> Ingreso Bruto</p>
                                                    <p className="font-black text-xl text-on-surface dark:text-white leading-none">{formatMoney(month.total_sales_usd)}</p>
                                                    <p className="text-[10px] font-bold text-on-surface-variant mt-1">Ticket Promedio: {formatMoney(month.average_ticket)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Fondo Negocio ({business_percentage}%)</p>
                                                    <p className="font-black text-lg text-on-surface dark:text-white leading-none">{formatMoney(fondoUsd)}</p>
                                                </div>
                                                <div className="bg-primary/5 dark:bg-dark-primary/10 p-2 -m-2 rounded">
                                                    <p className="text-[9px] font-black text-primary dark:text-dark-primary uppercase tracking-widest mb-0.5">Ganancia ({profit_percentage}%)</p>
                                                    <p className="font-black text-lg text-primary dark:text-dark-primary leading-none">{formatMoney(gananciaUsd)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-error uppercase tracking-widest mb-0.5 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">warning</span> Fugas</p>
                                                    <p className="font-black text-lg text-error leading-none">-{formatMoney(month.total_loss_usd)}</p>
                                                    <p className="text-[10px] font-bold text-error mt-1 bg-error/10 inline-block px-1 rounded">{month.loss_percentage.toFixed(1)}% del ingreso</p>
                                                </div>
                                            </div>

                                            {/* Reposición y Caja Real */}
                                            <div className="bg-surface-container-lowest dark:bg-[#161616] p-4 md:w-56 shrink-0 border-t md:border-t-0 md:border-l dark:border-dark-outline flex flex-col justify-center gap-3">
                                                <div>
                                                    <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">inventory_2</span> Reposición ({month.restock_count})</p>
                                                    <p className="font-black text-lg text-on-surface dark:text-white leading-none">-{formatMoney(month.total_restock_usd)}</p>
                                                </div>
                                                <div className="pt-2 border-t border-outline-variant/30 dark:border-dark-outline">
                                                    <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1" title="Fondo de Negocio - Costo de Reposición">Caja Libre del Negocio</p>
                                                    <p className={`font-black text-lg leading-none ${cajaReal < 0 ? 'text-error' : 'text-primary dark:text-dark-primary'}`}>
                                                        {formatMoney(cajaReal)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Barra visual de distribución del dinero */}
                                        {month.total_sales_usd > 0 && (
                                            <div className="h-1.5 w-full flex bg-surface-container-highest dark:bg-dark-outline">
                                                <div style={{ width: `${pctBusiness}%` }} className="bg-on-surface-variant dark:bg-gray-500" title="Negocio"></div>
                                                <div style={{ width: `${pctProfit}%` }} className="bg-primary dark:bg-dark-primary" title="Ganancia"></div>
                                                <div style={{ width: `${pctLoss}%` }} className="bg-error" title="Fuga"></div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </main>
        </MainLayout>
    );
}