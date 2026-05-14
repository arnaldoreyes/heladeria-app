import { useState } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

export default function Dashboard({
    totalVentasBs, totalVentasUsd, cantidadVentas, ventasRecientes,
    totalPerdidaBs = 0, totalPerdidaUsd = 0,
    ventasTetasBs = 0, ventasTetasUsd = 0,
    ventasHeladosBs = 0, ventasHeladosUsd = 0,
    topProductos = []
}) {

    const [selectedSale, setSelectedSale] = useState(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isTopGlobalOpen, setIsTopGlobalOpen] = useState(false);

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    };

    const paymentIcons = {
        'Efectivo': 'payments',
        'Pago Movil': 'smartphone',
        'Divisas': 'attach_money'
    };

    const top3Productos = topProductos.slice(0, 3);

    return (
        <MainLayout>
            <Head title="Resumen" />

            <main className="pt-8 md:pt-[40px] px-margin-mobile md:px-margin-desktop max-w-6xl mx-auto flex flex-col gap-lg h-full pb-20 transition-colors">

                {/* CONTENEDOR DE MÉTRICAS GLOBALES */}
                <div className="flex flex-col gap-4 w-full">

                    {/* TARJETA PRINCIPAL - RESTAURADA A FULL WIDTH */}
                    <div className="bg-surface-container-lowest dark:bg-dark-surface border border-primary dark:border-dark-outline rounded-xl p-6 md:p-8 shadow-sm relative overflow-hidden flex flex-col w-full transition-all">

                        {/* Icono de fondo marca de agua */}
                        <div className="absolute -right-10 -top-10 text-primary/5 dark:text-dark-primary/5 pointer-events-none">
                            <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                        </div>

                        {/* Cabecera de Tarjeta */}
                        <div className="relative z-10 flex items-center justify-between mb-6">
                            <h3 className="font-label-lg text-on-surface-variant dark:text-dark-on-surface-variant font-bold uppercase tracking-widest text-[11px]">Ingreso Bruto del Día</h3>
                            <div className="w-11 h-11 rounded-full bg-primary-container dark:bg-dark-primary/10 text-on-primary-container dark:text-dark-primary flex items-center justify-center border dark:border-dark-primary/20">
                                <span className="material-symbols-outlined text-[22px]">attach_money</span>
                            </div>
                        </div>

                        {/* Montos Globales Armonizados */}
                        <div className="relative z-10 flex flex-col md:flex-row md:items-baseline gap-2 mb-8">
                            <span className="font-display-lg text-5xl md:text-6xl font-black text-on-surface dark:text-white leading-none tracking-tighter">
                                ${formatMoney(totalVentasUsd)}
                            </span>
                            <div className="flex items-baseline gap-2 text-on-surface-variant dark:text-dark-on-surface-variant">
                                <span className="text-base md:text-lg font-bold opacity-70">
                                    / {formatMoney(totalVentasBs)} Bs
                                </span>
                                <span className="text-xs font-bold opacity-50 ml-2">• {cantidadVentas} ventas</span>
                            </div>
                        </div>

                        {/* Desglose por Categorías */}
                        <div className="relative z-10 flex gap-8 pt-5 border-t border-outline-variant/50 dark:border-dark-outline mt-auto">
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant mb-1 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-pink-500"></span> Tetas
                                </p>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="font-bold text-xl text-on-surface dark:text-white leading-none">${formatMoney(ventasTetasUsd)}</span>
                                    <span className="text-xs text-on-surface-variant dark:text-dark-on-surface-variant font-bold opacity-60">/ {formatMoney(ventasTetasBs)} Bs</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant mb-1 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Helados
                                </p>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="font-bold text-xl text-on-surface dark:text-white leading-none">${formatMoney(ventasHeladosUsd)}</span>
                                    <span className="text-xs text-on-surface-variant dark:text-dark-on-surface-variant font-bold opacity-60">/ {formatMoney(ventasHeladosBs)} Bs</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TARJETA HORIZONTAL DE PÉRDIDAS SUTIL */}
                    <div className="bg-error/5 dark:bg-[#1a0f0f] border border-error/20 dark:border-error/30 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between w-full transition-all group hover:bg-error/10 dark:hover:bg-[#241212]">
                        <div className="flex items-center gap-3 mb-2 sm:mb-0">
                            <div className="w-8 h-8 rounded-full bg-error/10 dark:bg-error/20 text-error flex items-center justify-center border border-error/20 shrink-0">
                                <span className="material-symbols-outlined text-[16px]">money_off</span>
                            </div>
                            <div>
                                <h3 className="font-label-md text-error/80 dark:text-error/90 font-bold uppercase tracking-widest text-[10px] leading-none">Fugas por Vuelto (Redondeo)</h3>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2 pl-11 sm:pl-0">
                            <span className="font-black text-error leading-none tracking-tighter text-lg">
                                ${formatMoney(totalPerdidaUsd)}
                            </span>
                            <span className="text-[11px] font-bold text-error/60 dark:text-error/50">
                                / {formatMoney(totalPerdidaBs)} Bs
                            </span>
                        </div>
                    </div>

                </div>

                {/* COLUMNAS INFERIORES */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* TOP 3 PRODUCTOS */}
                    <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-headline-sm font-bold text-on-surface dark:text-dark-on-surface tracking-tight flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary dark:text-dark-primary text-[20px]">stars</span>
                                Top 3 Estrella
                            </h2>
                            <button
                                onClick={() => setIsTopGlobalOpen(true)}
                                className="flex items-center gap-1.5 text-[10px] font-black text-primary dark:text-dark-primary uppercase tracking-widest hover:opacity-80 transition-all"
                            >
                                <span className="material-symbols-outlined text-[16px]">leaderboard</span>
                                Ver Global
                            </button>
                        </div>

                        <div className="flex flex-col gap-2.5">
                            {top3Productos && top3Productos.length > 0 ? (
                                top3Productos.map((producto, index) => (
                                    <div key={producto.id} className="bg-surface-container-lowest dark:bg-dark-surface border border-outline-variant dark:border-dark-outline rounded-xl p-4 flex justify-between items-center shadow-sm hover:border-primary dark:hover:border-dark-primary transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-surface-container dark:bg-dark-background flex items-center justify-center font-black text-on-surface-variant dark:text-dark-on-surface-variant border dark:border-dark-outline text-xs">
                                                #{index + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-on-surface dark:text-dark-on-surface uppercase text-sm tracking-tight">{producto.name}</p>
                                                <div className="mt-1">
                                                    {producto.category_id == 1 ? (
                                                        <span className="bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase shrink-0 border dark:border-pink-500/20">Teta</span>
                                                    ) : (
                                                        <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase shrink-0 border dark:border-blue-500/20">Helado</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className="font-black text-lg text-primary dark:text-dark-primary leading-none">{producto.total_vendido}</span>
                                            <span className="text-[9px] font-bold uppercase text-on-surface-variant dark:text-dark-on-surface-variant tracking-widest mt-1">Vendidos</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-8 border border-dashed border-outline-variant dark:border-dark-outline rounded-xl bg-surface-container-lowest dark:bg-dark-surface/30">
                                    <p className="text-on-surface-variant dark:text-dark-on-surface-variant font-medium text-sm">Sin datos para ranking.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* VENTAS RECIENTES */}
                    <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-headline-sm font-bold text-on-surface dark:text-dark-on-surface tracking-tight">
                                Ventas Recientes
                            </h2>
                            <button
                                onClick={() => setIsHistoryOpen(true)}
                                className="flex items-center gap-1.5 text-[10px] font-black text-primary dark:text-dark-primary uppercase tracking-widest hover:opacity-80 transition-all"
                            >
                                <span className="material-symbols-outlined text-[16px]">history</span>
                                Historial
                            </button>
                        </div>

                        <div className="flex flex-col gap-2.5">
                            {ventasRecientes && ventasRecientes.length > 0 ? (
                                ventasRecientes.map(venta => (
                                    <div
                                        key={venta.id}
                                        onClick={() => setSelectedSale(venta)}
                                        className="bg-surface-container-lowest dark:bg-dark-surface border border-outline-variant dark:border-dark-outline rounded-xl p-4 flex justify-between items-center shadow-sm hover:border-primary dark:hover:border-dark-primary cursor-pointer hover:bg-surface-container-lowest/80 dark:hover:bg-neutral-800 transition-all group"
                                    >
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
                                    <p className="text-on-surface-variant dark:text-dark-on-surface-variant font-medium text-sm">No hay registros hoy.</p>
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
                            <p className="text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant font-bold uppercase tracking-widest">Todos los productos</p>
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
                                    <div>
                                        <p className="font-bold text-xs text-on-surface dark:text-white uppercase tracking-tight">{producto.name}</p>
                                        <div className="mt-1">
                                            {producto.category_id == 1 ? (
                                                <span className="text-pink-600 dark:text-pink-400 text-[9px] font-black uppercase tracking-widest">Teta</span>
                                            ) : (
                                                <span className="text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest">Helado</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="font-black text-sm text-primary dark:text-dark-primary tracking-tight">{producto.total_vendido} <span className="text-[9px] font-bold text-on-surface-variant dark:text-dark-on-surface-variant uppercase ml-0.5">UND</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SIDEBAR: HISTORIAL DE VENTAS Y MODAL TICKET */}
            {selectedSale && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in transition-all">
                    <div className="bg-surface-container-lowest dark:bg-dark-surface w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden border dark:border-dark-outline">
                        <div className="px-5 py-5 border-b border-outline-variant/50 dark:border-dark-outline flex flex-col gap-4 bg-surface-bright dark:bg-dark-surface-container">
                            <div className="flex justify-between items-center">
                                <h2 className="font-headline-sm font-black text-on-surface dark:text-white tracking-tighter text-lg">Ticket #{selectedSale.id}</h2>
                                <button
                                    onClick={() => setSelectedSale(null)}
                                    className="text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-colors flex items-center justify-center"
                                >
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
                                const precioItemBs = Number(item.price_bs) || 0;
                                const precioUsd = precioItemBs / tasa;
                                const totalItemUsd = precioUsd * item.quantity;

                                return (
                                    <div key={item.id} className="grid grid-cols-12 items-center border-b border-outline-variant/30 dark:border-dark-outline/30 pb-3">
                                        <div className="col-span-2 font-black text-on-surface dark:text-dark-primary text-xs">
                                            {item.quantity}x
                                        </div>
                                        <div className="col-span-7 pr-2">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="font-bold text-body-sm text-on-surface dark:text-dark-on-surface leading-tight">
                                                    {item.product ? item.product.name : 'Eliminado'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="col-span-3 text-right font-black text-on-surface dark:text-white text-xs">
                                            ${totalItemUsd.toFixed(2)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="bg-surface-container-lowest dark:bg-dark-background p-6 border-t border-outline-variant/50 dark:border-dark-outline mt-auto">
                            {Number(selectedSale.discount_bs) > 0 && (
                                <div className="flex justify-between items-center text-primary dark:text-dark-primary mb-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">local_offer</span>
                                        Descuento Aplicado
                                    </span>
                                    <span className="font-black text-sm">- {formatMoney(selectedSale.discount_bs)} Bs</span>
                                </div>
                            )}
                            {Number(selectedSale.change_loss_bs) > 0 && (
                                <div className="flex justify-between items-center text-error mb-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">money_off</span>
                                        Pérdida por Vuelto
                                    </span>
                                    <span className="font-black text-sm">{formatMoney(selectedSale.change_loss_bs)} Bs</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest">Monto Pagado:</span>
                                <span className="font-display-lg font-black text-primary dark:text-dark-primary text-2xl tracking-tighter">
                                    ${formatMoney(selectedSale.total_usd)}
                                </span>
                            </div>
                            <div className="text-right text-[11px] font-black text-on-surface-variant dark:text-dark-on-surface-variant opacity-70">
                                / {formatMoney(selectedSale.total_bs)} BS
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className={`fixed inset-0 z-[110] transition-all duration-300 ${isHistoryOpen ? 'visible' : 'invisible'}`}>
                <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isHistoryOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsHistoryOpen(false)} />
                <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-surface dark:bg-dark-surface shadow-2xl border-l border-outline-variant dark:border-dark-outline transform transition-transform duration-300 flex flex-col ${isHistoryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="p-6 border-b border-outline-variant dark:border-dark-outline flex justify-between items-center bg-surface-container-low dark:bg-dark-background/50">
                        <div>
                            <h3 className="font-headline-sm font-black text-on-surface dark:text-white uppercase tracking-tighter text-lg">Historial de Ventas</h3>
                            <p className="text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant font-bold uppercase tracking-widest">Todas las transacciones</p>
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
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}