import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

export default function Dashboard({ totalVentasBs, totalVentasUsd, cantidadVentas, ventasRecientes }) {

    const [selectedSale, setSelectedSale] = useState(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    };

    // --- DICCIONARIO DE ICONOS PARA MÉTODOS DE PAGO ---
    const paymentIcons = {
        'Efectivo': 'payments',
        'Pago Movil': 'smartphone',
        'Divisas': 'attach_money'
    };

    return (
        <MainLayout>
            <Head title="Resumen" />

            <main className="pt-8 md:pt-[40px] px-margin-mobile md:px-margin-desktop max-w-5xl mx-auto flex flex-col gap-lg h-full pb-20 transition-colors">

                <div className="mb-2">
                    <h1 className="font-headline-lg text-headline-lg text-on-background dark:text-dark-on-surface font-bold mb-2 tracking-tight">Resumen</h1>
                    <p className="text-body-md text-on-surface-variant dark:text-dark-on-surface-variant font-medium">Rendimiento de ventas del día.</p>
                </div>

                {/* TARJETA PRINCIPAL - Estilo Carbono */}
                <div className="bg-surface-container-lowest dark:bg-dark-surface border border-primary dark:border-dark-outline rounded-xl p-6 md:p-8 shadow-sm relative overflow-hidden flex flex-col justify-between w-full transition-all">

                    {/* Icono de fondo con opacidad muy baja */}
                    <div className="absolute -right-10 -top-10 text-primary/5 dark:text-dark-primary/5 pointer-events-none">
                        <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                    </div>

                    <div className="relative z-10 flex items-center justify-between mb-6">
                        <h3 className="font-label-lg text-on-surface-variant dark:text-dark-on-surface-variant font-bold uppercase tracking-widest text-[11px]">Ventas del Día</h3>
                        <div className="w-11 h-11 rounded-full bg-primary-container dark:bg-dark-primary/10 text-on-primary-container dark:text-dark-primary flex items-center justify-center border dark:border-dark-primary/20">
                            <span className="material-symbols-outlined text-[22px]">attach_money</span>
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-end gap-4">
                        <div className="font-display-lg text-display-md md:text-5xl font-black text-on-surface dark:text-white leading-none tracking-tighter">
                            ${formatMoney(totalVentasUsd)}
                        </div>
                        <div className="flex items-center gap-3 text-body-md text-on-surface-variant dark:text-dark-on-surface-variant font-medium pb-1">
                            <span className="bg-surface-container-high dark:bg-dark-background px-3 py-1 rounded-md text-sm font-bold text-on-surface dark:text-dark-on-surface border dark:border-dark-outline">
                                ~ {formatMoney(totalVentasBs)} Bs
                            </span>
                            <span>•</span>
                            <span className="dark:text-dark-on-surface-variant">{cantidadVentas} ventas realizadas</span>
                        </div>
                    </div>
                </div>

                {/* VENTAS RECIENTES - Filas tipo editor de código */}
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-headline-sm font-bold text-on-surface dark:text-dark-on-surface tracking-tight">
                            Ventas Recientes
                        </h2>
                        {/* Botón para abrir el Historial Completo */}
                        <button
                            onClick={() => setIsHistoryOpen(true)}
                            className="flex items-center gap-2 text-[11px] font-black text-primary dark:text-dark-primary uppercase tracking-widest hover:opacity-80 transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">history</span>
                            Ver Historial Completo
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
                                                <p className="text-[11px] text-on-surface-variant dark:text-dark-on-surface-variant font-medium">Hoy, {formatTime(venta.created_at)}</p>
                                                {/* BADGE MÉTODO PAGO */}
                                                {venta.payment_method && (
                                                    <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-surface-container-high dark:bg-dark-surface px-1.5 py-0.5 rounded border dark:border-dark-outline text-on-surface-variant dark:text-dark-on-surface-variant">
                                                        <span className="material-symbols-outlined text-[10px]">{paymentIcons[venta.payment_method] || 'payments'}</span>
                                                        {venta.payment_method}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-on-surface dark:text-dark-on-surface text-sm">{formatMoney(venta.total_bs)} Bs</p>
                                        <p className="text-xs text-primary dark:text-dark-primary font-black tracking-tight">${formatMoney(venta.total_usd)}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center p-8 border border-dashed border-outline-variant dark:border-dark-outline rounded-xl bg-surface-container-lowest dark:bg-dark-surface/30">
                                <p className="text-on-surface-variant dark:text-dark-on-surface-variant font-medium">No hay registros hoy.</p>
                            </div>
                        )}
                    </div>
                </div>

            </main>

            {/* MODAL TICKET - Neutro Absoluto */}
            {selectedSale && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in transition-all">
                    <div className="bg-surface-container-lowest dark:bg-dark-surface w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden border dark:border-dark-outline">

                        <div className="px-5 py-5 border-b border-outline-variant/50 dark:border-dark-outline flex flex-col gap-4 bg-surface-bright dark:bg-dark-surface-container">

                            {/* Título y Cerrar */}
                            <div className="flex justify-between items-center">
                                <h2 className="font-headline-sm font-black text-on-surface dark:text-white tracking-tighter text-lg">Ticket #{selectedSale.id}</h2>
                                <button
                                    onClick={() => setSelectedSale(null)}
                                    className="text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-colors flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>

                            {/* Contenedor Dividido: Hora y Método de Pago */}
                            <div className="flex items-center justify-between bg-surface-container-lowest dark:bg-dark-background rounded-xl p-3 border border-outline-variant/50 dark:border-dark-outline/50 shadow-sm">

                                {/* Lado Izquierdo: Hora */}
                                <div className="flex items-center gap-2.5 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-surface-container dark:bg-dark-surface flex items-center justify-center text-on-surface-variant dark:text-dark-on-surface-variant border border-outline-variant/50 dark:border-dark-outline">
                                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-on-surface-variant dark:text-dark-on-surface-variant font-black uppercase tracking-widest mb-0.5">Registro</p>
                                        <p className="text-[11px] font-bold text-on-surface dark:text-white leading-none">{formatTime(selectedSale.created_at)}</p>
                                    </div>
                                </div>

                                {/* Separador */}
                                <div className="w-px h-6 bg-outline-variant dark:bg-dark-outline mx-2"></div>

                                {/* Lado Derecho: Método de Pago */}
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

                        <div className="p-6 flex flex-col gap-3 max-h-[50vh] overflow-y-auto">
                            <div className="grid grid-cols-12 text-[10px] font-black text-on-surface-variant dark:text-dark-on-surface-variant border-b border-outline-variant/50 dark:border-dark-outline pb-2 mb-2 uppercase tracking-widest">
                                <div className="col-span-2">Cant</div>
                                <div className="col-span-7 pl-1">Producto</div>
                                <div className="col-span-3 text-right">Total</div>
                            </div>

                            {selectedSale.items && selectedSale.items.map(item => {
                                const precioBs = item.product ? item.product.price : 0;
                                // Para cálculos visuales correctos en históricos, lo ideal sería guardar la tasa en el ticket
                                // y usar: const tasa = selectedSale.tasa_bcv || 500.46;
                                const tasa = selectedSale.tasa_bcv || 500.46; // Si en el futuro lo agregas a la DB
                                const precioUsd = item.price_bs / tasa;
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
                                                {item.product?.category_id == 1 && (
                                                    <span className="bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase shrink-0 border dark:border-pink-500/20">Teta</span>
                                                )}
                                                {item.product?.category_id == 2 && (
                                                    <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase shrink-0 border dark:border-blue-500/20">Helado</span>
                                                )}
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
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest">Monto Total:</span>
                                <span className="font-display-lg font-black text-primary dark:text-dark-primary text-2xl tracking-tighter">
                                    ${formatMoney(selectedSale.total_usd)}
                                </span>
                            </div>
                            <div className="text-right text-[11px] font-black text-on-surface-variant dark:text-dark-on-surface-variant opacity-70">
                                EQUIVALENTE A {formatMoney(selectedSale.total_bs)} BS
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* SIDEBAR DE HISTORIAL COMPLETO */}
            <div className={`fixed inset-0 z-[110] transition-all duration-300 ${isHistoryOpen ? 'visible' : 'invisible'}`}>
                {/* Overlay oscuro detras del sidebar */}
                <div
                    className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isHistoryOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsHistoryOpen(false)}
                />

                {/* Contenido del Sidebar */}
                <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-surface dark:bg-dark-surface shadow-2xl border-l border-outline-variant dark:border-dark-outline transform transition-transform duration-300 flex flex-col ${isHistoryOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                    {/* Cabecera del Sidebar */}
                    <div className="p-6 border-b border-outline-variant dark:border-dark-outline flex justify-between items-center bg-surface-container-low dark:bg-dark-background/50">
                        <div>
                            <h3 className="font-headline-sm font-black text-on-surface dark:text-white uppercase tracking-tighter text-lg">Historial de Ventas</h3>
                            <p className="text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant font-bold uppercase tracking-widest">Todas las transacciones</p>
                        </div>
                        <button onClick={() => setIsHistoryOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-error/10 text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-all">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>

                    {/* Lista de Ventas (Scrollable) */}
                    <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-2">
                        {ventasRecientes.map(venta => (
                            <div
                                key={venta.id}
                                onClick={() => setSelectedSale(venta)}
                                className="p-4 rounded-xl border border-outline-variant dark:border-dark-outline bg-surface-container-lowest dark:bg-dark-background/40 flex justify-between items-center cursor-pointer hover:border-primary dark:hover:border-dark-primary hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-surface-container dark:bg-dark-surface flex items-center justify-center text-primary dark:text-dark-primary group-hover:scale-110 transition-transform border border-transparent dark:border-dark-outline">
                                        <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-xs text-on-surface dark:text-white uppercase tracking-wider group-hover:text-primary dark:group-hover:text-dark-primary transition-colors">Ticket #{venta.id}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant font-medium">{formatTime(venta.created_at)}</p>
                                            {/* BADGE MÉTODO PAGO SIDEBAR */}
                                            {venta.payment_method && (
                                                <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-surface-container-high dark:bg-dark-surface px-1.5 py-0.5 rounded border dark:border-dark-outline text-on-surface-variant dark:text-dark-on-surface-variant">
                                                    <span className="material-symbols-outlined text-[10px]">{paymentIcons[venta.payment_method] || 'payments'}</span>
                                                    {venta.payment_method}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-sm text-primary dark:text-dark-primary tracking-tight">${formatMoney(venta.total_usd)}</p>
                                    <p className="font-bold text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant mt-0.5">{formatMoney(venta.total_bs)} Bs</p>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </MainLayout>
    );
}