import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

export default function Dashboard({ auth, totalVentasBs, totalVentasUsd, cantidadVentas, ventasRecientes }) {

    const [selectedSale, setSelectedSale] = useState(null);

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    };

    // Función para formatear la hora (Ej: 2:15 PM)
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <MainLayout>
            <Head title="Resumen" />

            {/* max-w-5xl controla que sea ancho pero no se deforme en pantallas gigantes */}
            <main className="pt-8 md:pt-[40px] px-margin-mobile md:px-margin-desktop max-w-5xl mx-auto flex flex-col gap-lg h-full pb-20">

                <div className="mb-2">
                    <h1 className="font-headline-lg text-headline-lg text-on-background font-bold mb-2">Resumen</h1>
                    <p className="text-body-md text-on-surface-variant">Rendimiento de ventas del día.</p>
                </div>

                {/* TARJETA ANCHA (Sin estar aplastada por el grid) */}
                <div className="bg-surface-container-lowest border border-primary rounded-xl p-6 md:p-8 shadow-sm relative overflow-hidden flex flex-col justify-between w-full">
                    <div className="absolute -right-10 -top-10 text-primary/5 pointer-events-none">
                        <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                    </div>

                    <div className="relative z-10 flex items-center justify-between mb-6">
                        <h3 className="font-label-lg text-on-surface-variant font-bold uppercase tracking-wider">Ventas del Día</h3>
                        <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined text-[24px]">attach_money</span>
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-end gap-4">
                        <div className="font-display-lg text-display-md md:text-5xl font-black text-on-surface leading-none">
                            ${formatMoney(totalVentasUsd)}
                        </div>
                        <div className="flex items-center gap-3 text-body-md text-on-surface-variant font-medium pb-1">
                            <span className="bg-surface-container-high px-3 py-1 rounded-md text-sm font-bold text-on-surface">
                                ~ {formatMoney(totalVentasBs)} Bs
                            </span>
                            <span>•</span>
                            <span>{cantidadVentas} ventas realizadas</span>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN RESTAURADA: VENTAS RECIENTES */}
                <div className="mt-4">
                    <h2 className="font-headline-sm font-bold text-on-surface mb-4">Ventas Recientes</h2>

                    <div className="flex flex-col gap-3">
                        {ventasRecientes && ventasRecientes.length > 0 ? (
                            ventasRecientes.map(venta => (
                                <div key={venta.id} onClick={() => setSelectedSale(venta)} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex justify-between items-center shadow-sm hover:border-primary cursor-pointer hover:bg-surface-container-lowest/80 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                                            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                                        </div>
                                        <div>
                                            {/* Por ahora mostramos el ID de la venta, luego sacaremos el detalle de los helados */}
                                            <p className="font-bold text-on-surface">Ticket de Venta #{venta.id}</p>
                                            <p className="text-body-sm text-on-surface-variant">Hoy, {formatTime(venta.created_at)} • Caja #1</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-on-surface">{formatMoney(venta.total_bs)} Bs</p>
                                        <p className="text-body-sm text-on-surface-variant font-bold text-primary">${formatMoney(venta.total_usd)}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center p-8 border border-dashed border-outline-variant rounded-xl bg-surface-container-lowest">
                                <p className="text-on-surface-variant font-medium">Aún no hay ventas registradas el día de hoy.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6">
                        <button className="text-primary font-bold text-label-md uppercase tracking-wider hover:underline">
                            VER TODAS LAS VENTAS
                        </button>
                    </div>
                </div>

            </main>
            {/* Modal de Detalles de la Venta (Ticket) */}
            {selectedSale && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-background/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                        {/* Cabecera del Ticket */}
                        <div className="px-6 py-4 border-b border-outline-variant/50 flex justify-between items-center bg-primary/5">
                            <div>
                                <h2 className="font-headline-sm font-bold text-primary">Ticket #{selectedSale.id}</h2>
                                <p className="text-body-sm text-on-surface-variant font-medium">Hoy, {formatTime(selectedSale.created_at)}</p>
                            </div>
                            <button
                                onClick={() => setSelectedSale(null)}
                                className="text-on-surface-variant hover:text-error bg-surface-container hover:bg-error/10 rounded-full p-2 transition-colors flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>

                        {/* Lista de Productos */}
                        <div className="p-6 flex flex-col gap-3 max-h-[50vh] overflow-y-auto">
                            <div className="grid grid-cols-12 text-label-sm font-bold text-on-surface-variant border-b border-outline-variant/50 pb-2 mb-2">
                                <div className="col-span-2">CANT</div>
                                <div className="col-span-7">PRODUCTO</div>
                                <div className="col-span-3 text-right">TOTAL</div>
                            </div>

                            {selectedSale.items && selectedSale.items.map(item => {
                                // 1. Extraemos el precio en Bs de forma segura
                                const precioBs = item.product ? item.product.price : 0;

                                // 2. Calculamos los dólares usando tu tasa fija actual
                                const tasaFija = 500.46;
                                const precioUsd = precioBs / tasaFija;
                                const totalItemUsd = precioUsd * item.quantity;

                                return (
                                    <div key={item.id} className="grid grid-cols-12 items-center border-b border-outline-variant/30 pb-3">
                                        <div className="col-span-2 font-bold text-on-surface">
                                            x{item.quantity}
                                        </div>
                                        <div className="col-span-7 pr-2">
                                            {/* Contenedor Flex para alinear el nombre y el badge */}
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="font-bold text-body-sm text-on-surface leading-tight">
                                                    {item.product ? item.product.name : 'Producto Eliminado'}
                                                </p>

                                                {/* Etiqueta de Categoría (Solo si el producto existe) */}
                                                {item.product && item.product.category_id == 1 && (
                                                    <span className="bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wide uppercase shrink-0">
                                                        TETA
                                                    </span>
                                                )}
                                                {item.product && item.product.category_id == 2 && (
                                                    <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wide uppercase shrink-0">
                                                        HELADO
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-label-sm text-on-surface-variant mt-0.5">
                                                ${precioUsd.toFixed(2)} c/u
                                            </p>
                                        </div>
                                        <div className="col-span-3 text-right font-bold text-on-surface">
                                            ${totalItemUsd.toFixed(2)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Totales del Ticket */}
                        <div className="bg-surface-container-lowest p-6 border-t border-outline-variant/50">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-body-md font-bold text-on-surface-variant">Total Pagado:</span>
                                <span className="font-headline-md font-black text-primary text-2xl leading-none">
                                    ${formatMoney(selectedSale.total_usd)}
                                </span>
                            </div>
                            <div className="text-right text-body-sm font-bold text-on-surface-variant">
                                ~ {formatMoney(selectedSale.total_bs)} Bs
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </MainLayout>
    );
}