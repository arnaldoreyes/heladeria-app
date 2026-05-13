import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

export default function POS({ products }) {
    const { tasa_bcv } = usePage().props;
    const tasaBCV = tasa_bcv;

    const [cart, setCart] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [toast, setToast] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');

    // --- NUEVOS ESTADOS DE BÚSQUEDA Y ORDENAMIENTO ---
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name_asc');

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

    const totalBs = cart.reduce((sum, item) => sum + (Number(item.product.price_bs) * item.quantity), 0);
    const totalUSD = cart.reduce((sum, item) => sum + (Number(item.product.price_usd) * item.quantity), 0);

    // --- LÓGICA DE FILTRADO, BÚSQUEDA Y ORDENAMIENTO ---
    const categoriasBase = ['Todos', 'Helado', 'Teta'];

    let productosProcesados = [...products];

    // 1. Filtro por Categoría
    if (selectedCategory !== 'Todos') {
        productosProcesados = productosProcesados.filter(p => p.category?.name === selectedCategory);
    }

    // 2. Filtro por Buscador (Texto)
    if (searchQuery.trim() !== '') {
        const lowerQuery = searchQuery.toLowerCase();
        productosProcesados = productosProcesados.filter(p =>
            p.name.toLowerCase().includes(lowerQuery)
        );
    }

    // 3. Ordenamiento
    productosProcesados.sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'price_desc') return Number(b.price_usd) - Number(a.price_usd);
        if (sortBy === 'price_asc') return Number(a.price_usd) - Number(b.price_usd);
        return 0;
    });
    // ---------------------------------------------------

    const confirmSale = () => {
        router.post(route('sales.store'), {
            cart: cart,
            tasa_bcv: tasaBCV,
            payment_method: paymentMethod
        }, {
            onSuccess: () => {
                setCart([]);
                setIsModalOpen(false);
                setPaymentMethod('Efectivo');
                setSearchQuery(''); // Limpia el buscador post-venta
                setToast('¡Venta registrada exitosamente!');
                setTimeout(() => setToast(''), 3000);
            }
        });
    };

    return (
        <MainLayout>
            <div className="bg-background text-on-background dark:bg-dark-background min-h-screen relative font-body-md text-body-md antialiased transition-colors">
                <Head title="Punto de Venta" />

                <main className="w-full px-margin-mobile py-md max-w-7xl mx-auto pb-40">

                    {/* BARRA DE HERRAMIENTAS FLOTANTE (Sin bordes contenedores) */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 w-full">

                        {/* Filtros de Categoría (Izquierda) */}
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar w-full lg:w-auto">
                            {categoriasBase.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    // CAMBIO AQUÍ: Quitamos py-2.5 y agregamos h-10 flex items-center justify-center
                                    className={`${selectedCategory === cat
                                        ? 'bg-primary text-on-primary shadow-sm dark:bg-dark-primary dark:text-dark-background'
                                        : 'bg-surface dark:bg-dark-surface border border-outline-variant dark:border-dark-outline text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-high dark:hover:bg-dark-surface-container'
                                        } px-5 h-10 flex items-center justify-center rounded-full font-label-md text-xs transition-colors font-bold uppercase tracking-wider whitespace-nowrap`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Buscador y Select de Orden (Derecha) */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">

                            {/* Buscador */}
                            {/* CAMBIO AQUÍ: Agregamos h-10 al contenedor padre */}
                            <div className="relative w-full sm:w-64 lg:w-72 h-10">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-dark-on-surface-variant text-[18px]">search</span>
                                {/* CAMBIO AQUÍ: Quitamos py-2.5 y agregamos h-full */}
                                <input
                                    type="text"
                                    placeholder="Buscar producto..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-full pl-10 pr-4 bg-surface dark:bg-dark-surface border border-outline-variant dark:border-dark-outline rounded-full text-sm font-medium text-on-surface dark:text-white focus:border-primary dark:focus:border-dark-primary transition-colors shadow-sm placeholder:text-on-surface-variant/50"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error transition-colors flex items-center">
                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                    </button>
                                )}
                            </div>

                            {/* Ordenamiento */}
                            <div className="flex items-center gap-2 w-full sm:w-auto text-on-surface-variant dark:text-dark-on-surface-variant">
                                <span className="material-symbols-outlined text-[20px] hidden sm:block">sort</span>
                                {/* CAMBIO AQUÍ: Quitamos py-2.5 y agregamos h-10 */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full sm:w-auto h-10 bg-surface dark:bg-dark-surface border border-outline-variant dark:border-dark-outline text-on-surface dark:text-white rounded-full pl-4 pr-10 text-[11px] font-bold uppercase tracking-widest focus:border-primary dark:focus:border-dark-primary transition-colors cursor-pointer shadow-sm"
                                >
                                    <option value="name_asc">Alfabético (A-Z)</option>
                                    <option value="price_desc">Mayor Precio ($)</option>
                                    <option value="price_asc">Menor Precio ($)</option>
                                </select>
                            </div>
                        </div>

                    </div>

                    {/* Grilla de Productos */}
                    {productosProcesados.length === 0 ? (
                        <div className="text-center p-12 mt-8 border border-dashed border-outline-variant dark:border-dark-outline rounded-2xl bg-surface-container-lowest dark:bg-dark-background/40">
                            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/50 dark:text-dark-on-surface-variant/50 mb-4 block">inventory_2</span>
                            <p className="text-on-surface-variant dark:text-dark-on-surface-variant font-bold text-lg">No se encontraron productos.</p>
                            <p className="text-sm opacity-70 mt-1">Prueba buscando con otro nombre o cambiando la categoría.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-sm">
                            {productosProcesados.map(product => {
                                const qty = getProductQty(product.id);
                                const precioUSD = Number(product.price_usd).toFixed(2);
                                const precioBs = Number(product.price_bs).toFixed(2);

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
                                                <p className="font-label-sm text-on-surface-variant dark:text-dark-on-surface-variant font-bold text-[10px]">{precioBs} Bs</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
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
                                                    ${Number(item.product.price_usd).toFixed(2)} <span className="opacity-50">({Number(item.product.price_bs).toFixed(2)} Bs)</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            <p className="font-body-md text-on-surface dark:text-white font-black text-sm">
                                                ${(Number(item.product.price_usd) * item.quantity).toFixed(2)}
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
                                <div className="mb-4">
                                    <label className="font-label-md text-on-surface-variant dark:text-dark-on-surface-variant mb-2 block font-black text-[10px] uppercase tracking-widest">
                                        Método de Pago
                                    </label>
                                    <div className="flex gap-2">
                                        {[
                                            { id: 'Efectivo', icon: 'payments' },
                                            { id: 'Pago Movil', icon: 'smartphone' },
                                            { id: 'Divisas', icon: 'attach_money' }
                                        ].map(method => {
                                            const isActive = paymentMethod === method.id;
                                            return (
                                                <button
                                                    key={method.id}
                                                    type="button"
                                                    onClick={() => setPaymentMethod(method.id)}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg font-black text-[10px] uppercase transition-all border ${isActive
                                                        ? 'bg-primary/10 border-primary text-primary dark:bg-dark-primary/10 dark:border-dark-primary dark:text-dark-primary shadow-sm'
                                                        : 'bg-surface-container-high dark:bg-dark-background text-on-surface-variant dark:text-dark-on-surface-variant border-transparent dark:border-dark-outline hover:bg-surface-container-highest dark:hover:bg-dark-surface'
                                                        }`}
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">
                                                        {method.icon}
                                                    </span>
                                                    <span className="hidden sm:inline">{method.id}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mb-md pt-2 border-t border-outline-variant/50 dark:border-dark-outline">
                                    <p className="font-headline-sm text-on-surface dark:text-white font-black text-lg uppercase tracking-tighter">Total</p>
                                    <div className="text-right">
                                        <p className="font-headline-md text-primary dark:text-dark-primary font-black leading-none text-2xl tracking-tighter">${totalUSD.toFixed(2)}</p>
                                        <p className="text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant mt-1 font-black opacity-60">~ {totalBs.toFixed(2)} Bs</p>
                                    </div>
                                </div>
                                <button
                                    onClick={confirmSale}
                                    className="w-full bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background py-sm rounded-lg font-label-md text-headline-sm font-black shadow-md hover:opacity-90 transition-all flex justify-center items-center gap-2 border dark:border-dark-primary/20"
                                >
                                    <span className="material-symbols-outlined">verified</span>
                                    CONFIRMAR VENTA
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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