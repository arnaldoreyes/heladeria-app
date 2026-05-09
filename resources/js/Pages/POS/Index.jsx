import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

export default function POS({ auth, products }) {
    // Tasa BCV (Temporal hasta conectarla a la API real)
    const tasaBCV = 500.46;

    // Estados
    const [cart, setCart] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [toast, setToast] = useState('');

    // Lógica del carrito
    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.product.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevCart, { product, quantity: 1 }];
        });
    };

    // Función para restar 1 unidad
    const decreaseQuantity = (productId) => {
        setCart(prevCart => {
            // Restamos 1, y si llega a 0, el filter() lo saca de la lista automáticamente
            const newCart = prevCart.map(item => {
                if (item.product.id === productId) {
                    return { ...item, quantity: item.quantity - 1 };
                }
                return item;
            }).filter(item => item.quantity > 0);

            // Si el carrito se queda vacío, cerramos el modal
            if (newCart.length === 0) setIsModalOpen(false);
            return newCart;
        });
    };

    // Función para eliminar el producto por completo de un solo golpe
    const removeItem = (productId) => {
        setCart(prevCart => {
            const newCart = prevCart.filter(item => item.product.id !== productId);
            if (newCart.length === 0) setIsModalOpen(false);
            return newCart;
        });
    };

    const getProductQty = (productId) => {
        const item = cart.find(i => i.product.id === productId);
        return item ? item.quantity : 0;
    };

    // Cálculos de totales (Recordemos que en DB el precio está en Bs)
    const totalBs = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalUSD = totalBs / tasaBCV;

    // Filtro de Categorías
    const categoriasBase = ['Todos', 'Helado', 'Teta'];
    const productosFiltrados = selectedCategory === 'Todos'
        ? products
        : products.filter(p => p.category?.name === selectedCategory);

    return (
        <MainLayout>
            <div className="bg-background text-on-background min-h-screen relative font-body-md text-body-md antialiased overflow-hidden">
                <Head title="Punto de Venta" />


                {/* Main POS Canvas */}
                <main className="w-full px-margin-mobile py-md max-w-7xl mx-auto pb-40 h-[calc(100vh-72px)] overflow-y-auto">

                    {/* Category Filters */}
                    <div className="flex gap-sm overflow-x-auto pb-sm mb-sm hide-scrollbar whitespace-nowrap">
                        {categoriasBase.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`${selectedCategory === cat ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'} px-md py-xs rounded-full font-label-md text-label-md transition-colors font-bold uppercase`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Product Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-sm">
                        {productosFiltrados.map(product => {
                            const qty = getProductQty(product.id);
                            const precioUSD = (product.price / tasaBCV).toFixed(2);

                            return (
                                <div
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className={`bg-surface border rounded-xl p-xs flex flex-col cursor-pointer transition-all relative shadow-sm hover:shadow-md select-none ${qty > 0 ? 'border-primary ring-1 ring-primary' : 'border-outline-variant hover:border-primary/50'}`}
                                >
                                    <div className="w-full aspect-square rounded-lg bg-surface-container-highest mb-xs overflow-hidden relative">
                                        {/* Si el producto no tiene imagen, mostramos el icono */}
                                        <div className={`w-full h-full flex items-center justify-center ${product.category?.name === 'Teta' ? 'bg-pink-100 text-pink-400' : 'bg-blue-100 text-blue-400'}`}>
                                            <span className="material-symbols-outlined opacity-80 text-[40px]">icecream</span>
                                        </div>

                                        {/* Selected Badge & Controls */}
                                        {qty > 0 && (
                                            <div className="absolute top-2 right-2 flex items-center gap-1 z-10">

                                                {/* Botón Eliminar (Rojo para evitar accidentes) */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Evita que la tarjeta registre el clic y agregue uno nuevo
                                                        removeItem(product.id);
                                                    }}
                                                    className="bg-error text-onError w-7 h-7 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform active:scale-95"
                                                    title="Quitar del carrito"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                </button>

                                                {/* Botón Restar */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Evita que la tarjeta registre el clic
                                                        decreaseQuantity(product.id);
                                                    }}
                                                    className="bg-primary text-on-primary w-7 h-7 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform active:scale-95"
                                                    title="Restar una unidad"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">remove</span>
                                                </button>

                                                {/* Indicador de Cantidad Actual (Mismo aspecto) */}
                                                <div className="bg-primary text-on-primary w-7 h-7 rounded-full flex items-center justify-center font-label-md text-[13px] shadow-md font-bold">
                                                    {qty}
                                                </div>

                                            </div>
                                        )}
                                    </div>
                                    <div className="px-xs pb-xs flex-grow flex flex-col justify-between">
                                        <h3 className="font-headline-sm text-body-md font-bold leading-tight line-clamp-2 mb-1 text-gray-800">{product.name}</h3>
                                        <div className="flex justify-between items-baseline mt-1 border-t border-outline-variant/30 pt-1">
                                            <p className="font-label-md text-primary font-black">${precioUSD}</p>
                                            <p className="font-label-sm text-on-surface-variant font-bold">{Number(product.price).toFixed(2)} Bs</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>

                {/* Fixed Action Bottom (Guardar) - Solo aparece si hay items */}
                {cart.length > 0 && (
                    <div className="fixed bottom-[80px] md:bottom-md left-0 w-full px-margin-mobile md:px-margin-desktop z-40 flex justify-center animate-fade-in">
                        <div className="w-full max-w-md">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full bg-primary text-on-primary py-sm rounded-full font-label-md text-headline-sm font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-primary-container transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined">save</span>
                                Ver Pedido (${totalUSD.toFixed(2)})
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal: Resumen de la venta */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-on-background/40 backdrop-blur-sm">
                        <div className="bg-surface w-full md:w-[90%] md:max-w-md rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">

                            {/* Modal Header */}
                            <div className="px-md py-sm border-b border-outline-variant flex justify-between items-center bg-surface-bright">
                                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Resumen de la venta</h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-on-surface-variant hover:text-on-surface rounded-full p-1 hover:bg-surface-container transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            {/* Modal Body (Items List) */}
                            <div className="p-md flex flex-col gap-sm max-h-[50vh] overflow-y-auto">
                                {cart.map(item => (
                                    <div key={item.product.id} className="flex justify-between items-center border-b border-outline-variant/50 pb-sm">

                                        <div className="flex items-center gap-3">
                                            {/* Nuevos Controles (+ / -) */}
                                            <div className="flex items-center bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden shadow-sm">
                                                <button onClick={() => decreaseQuantity(item.product.id)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-error transition-colors">
                                                    <span className="material-symbols-outlined text-[18px]">remove</span>
                                                </button>
                                                <span className="w-6 text-center font-bold text-on-surface text-sm">{item.quantity}</span>
                                                <button onClick={() => addToCart(item.product)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                                </button>
                                            </div>

                                            <div>
                                                <p className="font-body-md text-on-surface font-bold leading-tight">{item.product.name}</p>
                                                <p className="font-body-sm text-on-surface-variant mt-0.5">
                                                    ${(item.product.price / tasaBCV).toFixed(2)} <span className="text-[10px]">({Number(item.product.price).toFixed(2)} Bs)</span> c/u
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            <p className="font-body-md text-on-surface font-black">
                                                ${((item.product.price / tasaBCV) * item.quantity).toFixed(2)}
                                            </p>
                                            {/* Botón de eliminar por completo */}
                                            <button onClick={() => removeItem(item.product.id)} className="text-error/70 hover:text-error text-[12px] font-bold flex items-center gap-1 transition-colors">
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                                Quitar
                                            </button>
                                        </div>

                                    </div>
                                ))}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-md bg-surface-container-lowest border-t border-outline-variant">
                                <div className="flex justify-between items-center mb-xs">
                                    <p className="font-body-md text-on-surface-variant font-semibold">Subtotal</p>
                                    <p className="font-body-md text-on-surface font-bold">${totalUSD.toFixed(2)}</p>
                                </div>
                                <div className="flex justify-between items-center mb-md">
                                    <p className="font-headline-sm text-on-surface font-black text-xl">Total a Pagar</p>
                                    <div className="text-right">
                                        <p className="font-headline-md text-primary font-black leading-none text-2xl">${totalUSD.toFixed(2)}</p>
                                        <p className="font-label-md text-on-surface-variant mt-1 font-bold">~ {totalBs.toFixed(2)} Bs</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        router.post(route('sales.store'), {
                                            cart: cart,
                                            tasa_bcv: tasaBCV
                                        }, {
                                            onSuccess: () => {
                                                setCart([]);
                                                setIsModalOpen(false);
                                                // Reemplazo del alert:
                                                setToast('¡Venta registrada exitosamente!');
                                                setTimeout(() => setToast(''), 3000); // Se oculta a los 3 segundos
                                            }
                                        });
                                    }}
                                    className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md text-headline-sm font-bold shadow-md hover:bg-primary-container hover:shadow-lg transition-all flex justify-center items-center gap-2"
                                >
                                    <span className="material-symbols-outlined">check_circle</span>
                                    Confirmar Venta
                                </button>
                            </div>

                        </div>
                    </div>
                )}
                {/* Notificación Toast */}
                {toast && (
                    <div className="fixed top-24 right-4 bg-primary text-on-primary px-6 py-3 rounded-lg shadow-2xl z-[200] font-bold animate-fade-in flex items-center gap-2">
                        <span className="material-symbols-outlined">check_circle</span>
                        {toast}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}