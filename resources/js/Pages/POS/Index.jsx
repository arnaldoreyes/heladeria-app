import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

export default function POS({ products }) {
    const { tasa_bcv } = usePage().props;
    const tasaBCV = Number(tasa_bcv);

    const [cart, setCart] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [toast, setToast] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');

    // NUEVO: En lugar de pérdida, pedimos el monto que entregó el cliente
    const [amountPaid, setAmountPaid] = useState('');

    const [selectedCategory, setSelectedCategory] = useState(() => {
        return localStorage.getItem('ik_pos_category') || 'Todos';
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState(() => {
        return localStorage.getItem('ik_pos_sort') || 'name_asc';
    });

    useEffect(() => localStorage.setItem('ik_pos_category', selectedCategory), [selectedCategory]);
    useEffect(() => localStorage.setItem('ik_pos_sort', sortBy), [sortBy]);

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

    // --- MATEMÁTICA PROTEGIDA (Precios dinámicos vs BCV) ---
    const subtotalUSD = cart.reduce((sum, item) => sum + (Number(item.product.price_usd) * item.quantity), 0);
    const subtotalBs = subtotalUSD * tasaBCV; // Ahora nace del USD, cero desfases.

    const tetasQty = cart
        .filter(item => item.product.category_id == 1 || item.product.category?.name === 'Teta')
        .reduce((sum, item) => sum + item.quantity, 0);

    const promoPairs = Math.floor(tetasQty / 2);
    // Descuento de $0.20 USD por cada par (Protege tu margen ante subidas del BCV)
    const discountUSD = promoPairs * 0.20;
    const discountBs = discountUSD * tasaBCV;

    const totalUSD = subtotalUSD - discountUSD;
    const totalBs = subtotalBs - discountBs;

    // --- CÁLCULO DE PÉRDIDA AUTOMÁTICO ---
    const parsedAmountPaid = Number(amountPaid);
    // Si metió un monto y es menor al total a cobrar, calculamos la pérdida exacta.
    const calculatedLossBs = (parsedAmountPaid > 0 && parsedAmountPaid < totalBs)
        ? totalBs - parsedAmountPaid
        : 0;
    // --------------------------------------------------------

    const categoriasBase = ['Todos', 'Helado', 'Teta'];
    let productosProcesados = [...products];

    if (selectedCategory !== 'Todos') {
        productosProcesados = productosProcesados.filter(p => p.category?.name === selectedCategory);
    }

    if (searchQuery.trim() !== '') {
        const lowerQuery = searchQuery.toLowerCase();
        productosProcesados = productosProcesados.filter(p =>
            p.name.toLowerCase().includes(lowerQuery)
        );
    }

    productosProcesados.sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'price_desc') return Number(b.price_usd) - Number(a.price_usd);
        if (sortBy === 'price_asc') return Number(a.price_usd) - Number(b.price_usd);
        return 0;
    });

    const confirmSale = () => {
        router.post(route('sales.store'), {
            cart: cart,
            tasa_bcv: tasaBCV,
            payment_method: paymentMethod,
            subtotal_bs: subtotalBs,
            discount_bs: discountBs,
            total_bs: totalBs,
            total_usd: totalUSD,
            change_loss_bs: calculatedLossBs // Enviamos la pérdida procesada por el sistema
        }, {
            onSuccess: () => {
                setCart([]);
                setIsModalOpen(false);
                setPaymentMethod('Efectivo');
                setSearchQuery('');
                setAmountPaid('');
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
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 w-full">
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar w-full lg:w-auto">
                            {categoriasBase.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`${selectedCategory === cat
                                        ? 'bg-primary text-on-primary shadow-sm dark:bg-dark-primary dark:text-dark-background'
                                        : 'bg-surface dark:bg-dark-surface border border-outline-variant dark:border-dark-outline text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-high dark:hover:bg-dark-surface-container'
                                        } px-5 h-10 flex items-center justify-center rounded-full font-label-md text-xs transition-colors font-bold uppercase tracking-wider whitespace-nowrap`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                            <div className="relative w-full sm:w-64 lg:w-72 h-10">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-dark-on-surface-variant text-[18px]">search</span>
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

                            <div className="flex items-center gap-2 w-full sm:w-auto text-on-surface-variant dark:text-dark-on-surface-variant">
                                <span className="material-symbols-outlined text-[20px] hidden sm:block">sort</span>
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
                                // CÁLCULO DINÁMICO DEL PRECIO EN BS
                                const precioBs = (Number(product.price_usd) * tasaBCV).toFixed(2);

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

                            <div className="p-md flex flex-col gap-sm max-h-[40vh] overflow-y-auto">
                                {cart.map(item => {
                                    // PRECIO REAL PARA EL TICKET BASADO EN TASA ACTUAL
                                    const itemBs = (Number(item.product.price_usd) * tasaBCV).toFixed(2);

                                    return (
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
                                                        ${Number(item.product.price_usd).toFixed(2)} <span className="opacity-50">({itemBs} Bs)</span>
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
                                    )
                                })}
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

                                {/* MEJORA UX: INPUT DE MONTO PAGADO */}
                                {paymentMethod === 'Efectivo' && (
                                    <div className="mt-4 p-3 border border-outline-variant dark:border-dark-outline bg-surface-container-high dark:bg-dark-surface-container rounded-lg animate-fade-in">
                                        <label className="font-label-md text-on-surface-variant dark:text-dark-on-surface-variant mb-1.5 block font-black text-[10px] uppercase tracking-widest">
                                            Monto Cancelado por el cliente (Bs)
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            placeholder={`Ej. ${Math.floor(totalBs)}`}
                                            value={amountPaid}
                                            onChange={(e) => setAmountPaid(e.target.value.replace(/[^0-9.]/g, ''))}
                                            className="w-full bg-surface dark:bg-dark-background border border-outline-variant/50 dark:border-dark-outline rounded-md px-3 py-2 text-on-surface dark:text-white font-black text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                        />

                                        {/* INDICADOR VISUAL DE PÉRDIDA SI NO PAGA COMPLETO */}
                                        {calculatedLossBs > 0 && (
                                            <p className="text-error font-bold text-[10px] mt-2 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">warning</span>
                                                El sistema registrará una pérdida de {calculatedLossBs.toFixed(2)} Bs
                                            </p>
                                        )}
                                    </div>
                                )}
                                {/* ------------------------------- */}

                                <div className="border-t border-outline-variant/50 dark:border-dark-outline pt-3 mt-4">

                                    {discountBs > 0 && (
                                        <>
                                            <div className="flex justify-between items-center text-on-surface-variant dark:text-dark-on-surface-variant mb-1">
                                                <p className="text-xs font-bold uppercase tracking-widest">Subtotal</p>
                                                <p className="text-sm font-bold">${subtotalUSD.toFixed(2)}</p>
                                            </div>
                                            <div className="flex justify-between items-center text-primary dark:text-dark-primary mb-2">
                                                <p className="text-[11px] font-black uppercase tracking-widest flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">local_offer</span>
                                                    Promo Tetas ({promoPairs} pares)
                                                </p>
                                                <p className="text-sm font-black">-${discountUSD.toFixed(2)}</p>
                                            </div>
                                        </>
                                    )}

                                    <div className="flex justify-between items-end mt-2">
                                        <p className="font-headline-sm text-on-surface dark:text-white font-black text-lg uppercase tracking-tighter">Total</p>
                                        <div className="text-right">
                                            <p className="font-headline-md text-primary dark:text-dark-primary font-black leading-none text-2xl tracking-tighter">${totalUSD.toFixed(2)}</p>
                                            <p className="text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant mt-1 font-black opacity-60">~ {totalBs.toFixed(2)} Bs</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={confirmSale}
                                    className="mt-4 w-full bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background py-sm rounded-lg font-label-md text-headline-sm font-black shadow-md hover:opacity-90 transition-all flex justify-center items-center gap-2 border dark:border-dark-primary/20"
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