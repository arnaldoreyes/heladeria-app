import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

export default function POS({ products }) {
    const { tasa_bcv } = usePage().props;
    const tasaBCV = tasa_bcv;

    const [cart, setCart] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [toast, setToast] = useState('');

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

    const decreaseQuantity = (productId) => {
        setCart(prevCart => {
            const newCart = prevCart.map(item => {
                if (item.product.id === productId) {
                    return { ...item, quantity: item.quantity - 1 };
                }
                return item;
            }).filter(item => item.quantity > 0);

            if (newCart.length === 0) setIsModalOpen(false);
            return newCart;
        });
    };

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

    const totalBs = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalUSD = totalBs / tasaBCV;

    const categoriasBase = ['Todos', 'Helado', 'Teta'];
    const productosFiltrados = selectedCategory === 'Todos'
        ? products
        : products.filter(p => p.category?.name === selectedCategory);

    return (
        <MainLayout>
            <div className="bg-background text-on-background dark:bg-dark-background min-h-screen relative font-body-md text-body-md antialiased transition-colors">
                <Head title="Punto de Venta" />

                <main className="w-full px-margin-mobile py-md max-w-7xl mx-auto pb-40">

                    {/* Filtros de Categoría */}
                    <div className="flex gap-sm overflow-x-auto pb-sm mb-sm hide-scrollbar whitespace-nowrap">
                        {categoriasBase.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`${selectedCategory === cat
                                    ? 'bg-primary text-on-primary shadow-sm dark:bg-dark-primary dark:text-dark-background'
                                    : 'bg-surface dark:bg-dark-surface border border-outline-variant dark:border-dark-outline text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-high dark:hover:bg-dark-surface-container'
                                    } px-md py-xs rounded-full font-label-md text-label-md transition-colors font-bold uppercase tracking-wider`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Grilla de Productos */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-sm">
                        {productosFiltrados.map(product => {
                            const qty = getProductQty(product.id);
                            const precioUSD = (product.price / tasaBCV).toFixed(2);

                            return (
                                <div
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className={`bg-surface dark:bg-dark-surface border rounded-xl p-xs flex flex-col cursor-pointer transition-all relative shadow-sm hover:shadow-md select-none ${qty > 0
                                        ? 'border-primary ring-1 ring-primary dark:border-dark-primary dark:ring-dark-primary'
                                        : 'border-outline-variant dark:border-dark-outline hover:border-primary/50 dark:hover:border-dark-primary/50'
                                        }`}
                                >
                                    <div className="w-full aspect-square rounded-lg bg-surface-container-highest dark:bg-dark-background mb-xs overflow-hidden relative transition-colors border dark:border-dark-outline/50">
                                        <div className={`w-full h-full flex items-center justify-center ${product.category?.name === 'Teta'
                                            ? 'bg-pink-100 dark:bg-pink-900/20 text-pink-400 dark:text-pink-500'
                                            : 'bg-blue-100 dark:bg-blue-900/20 text-blue-400 dark:text-blue-500'
                                            }`}>
                                            <span className="material-symbols-outlined opacity-80 text-[40px]">icecream</span>
                                        </div>

                                        {qty > 0 && (
                                            <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeItem(product.id);
                                                    }}
                                                    className="bg-error text-onError w-7 h-7 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform active:scale-95 border dark:border-error/30"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                </button>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        decreaseQuantity(product.id);
                                                    }}
                                                    className="bg-primary text-on-primary dark:bg-dark-primary dark:text-dark-background w-7 h-7 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform active:scale-95"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">remove</span>
                                                </button>

                                                <div className="bg-primary text-on-primary dark:bg-dark-primary dark:text-dark-background w-7 h-7 rounded-full flex items-center justify-center font-label-md text-[13px] shadow-md font-black">
                                                    {qty}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-xs pb-xs flex-grow flex flex-col justify-between">
                                        <h3 className="font-headline-sm text-body-md font-bold leading-tight line-clamp-2 mb-1 text-gray-800 dark:text-dark-on-surface transition-colors uppercase tracking-tight text-xs">
                                            {product.name}
                                        </h3>
                                        <div className="flex justify-between items-baseline mt-1 border-t border-outline-variant/30 dark:border-dark-outline pt-1 transition-colors">
                                            <p className="font-label-md text-primary dark:text-dark-primary font-black tracking-tighter text-sm">${precioUSD}</p>
                                            <p className="font-label-sm text-on-surface-variant dark:text-dark-on-surface-variant font-bold text-[10px]">{Number(product.price).toFixed(2)} Bs</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>

                {/* Botón Flotante de Ver Pedido */}
                {cart.length > 0 && (
                    <div className="fixed bottom-[80px] md:bottom-md left-0 w-full px-margin-mobile md:px-margin-desktop z-40 flex justify-center animate-fade-in">
                        <div className="w-full max-w-md">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background py-sm rounded-full font-label-md text-headline-sm font-black shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 border dark:border-dark-primary/20"
                            >
                                <span className="material-symbols-outlined font-bold">shopping_cart_checkout</span>
                                VER PEDIDO (${totalUSD.toFixed(2)})
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal de Pago / Resumen */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-colors">
                        <div className="bg-surface dark:bg-dark-surface w-full md:max-w-md rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-slide-up border dark:border-dark-outline">

                            <div className="px-md py-sm border-b border-outline-variant dark:border-dark-outline flex justify-between items-center bg-surface-bright dark:bg-dark-surface-container">
                                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface dark:text-dark-on-surface uppercase tracking-widest text-xs">Resumen de la venta</h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-on-surface-variant dark:text-dark-on-surface-variant hover:text-on-surface dark:hover:text-white rounded-full p-1 hover:bg-surface-container dark:hover:bg-dark-background transition-colors border dark:border-dark-outline"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="p-md flex flex-col gap-sm max-h-[50vh] overflow-y-auto">
                                {cart.map(item => (
                                    <div key={item.product.id} className="flex justify-between items-center border-b border-outline-variant/50 dark:border-dark-outline pb-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center bg-surface-container-lowest dark:bg-dark-background rounded-lg border border-outline-variant dark:border-dark-outline overflow-hidden shadow-sm">
                                                <button onClick={() => decreaseQuantity(item.product.id)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container dark:hover:bg-dark-surface hover:text-error transition-colors">
                                                    <span className="material-symbols-outlined text-[18px]">remove</span>
                                                </button>
                                                <span className="w-6 text-center font-bold text-on-surface dark:text-white text-xs">{item.quantity}</span>
                                                <button onClick={() => addToCart(item.product)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container dark:hover:bg-dark-surface hover:text-dark-primary transition-colors">
                                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                                </button>
                                            </div>

                                            <div>
                                                <p className="font-body-md text-on-surface dark:text-dark-on-surface font-bold leading-tight text-sm uppercase">{item.product.name}</p>
                                                <p className="font-body-sm text-on-surface-variant dark:text-dark-on-surface-variant mt-0.5 text-[10px] font-medium">
                                                    ${(item.product.price / tasaBCV).toFixed(2)} <span className="opacity-50">({Number(item.product.price).toFixed(2)} Bs)</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            <p className="font-body-md text-on-surface dark:text-white font-black text-sm">
                                                ${((item.product.price / tasaBCV) * item.quantity).toFixed(2)}
                                            </p>
                                            <button onClick={() => removeItem(item.product.id)} className="text-error/70 dark:text-error/80 hover:text-error text-[10px] font-black uppercase flex items-center gap-1 transition-colors">
                                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                                Quitar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-md bg-surface-container-lowest dark:bg-dark-background border-t border-outline-variant dark:border-dark-outline">
                                <div className="flex justify-between items-center mb-md">
                                    <p className="font-headline-sm text-on-surface dark:text-white font-black text-lg uppercase tracking-tighter">Total</p>
                                    <div className="text-right">
                                        <p className="font-headline-md text-primary dark:text-dark-primary font-black leading-none text-2xl tracking-tighter">${totalUSD.toFixed(2)}</p>
                                        <p className="text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant mt-1 font-black opacity-60">~ {totalBs.toFixed(2)} Bs</p>
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
                                                setToast('¡Venta registrada exitosamente!');
                                                setTimeout(() => setToast(''), 3000);
                                            }
                                        });
                                    }}
                                    className="w-full bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background py-sm rounded-lg font-label-md text-headline-sm font-black shadow-md hover:opacity-90 transition-all flex justify-center items-center gap-2 border dark:border-dark-primary/20"
                                >
                                    <span className="material-symbols-outlined">verified</span>
                                    CONFIRMAR VENTA
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notificación Toast */}
                {toast && (
                    <div className="fixed top-24 right-4 bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background px-6 py-3 rounded-lg shadow-2xl z-[200] font-black animate-fade-in flex items-center gap-2 border dark:border-dark-primary/30">
                        <span className="material-symbols-outlined">check_circle</span>
                        <span className="text-xs uppercase tracking-widest">{toast}</span>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}