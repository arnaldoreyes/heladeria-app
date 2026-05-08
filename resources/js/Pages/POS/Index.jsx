import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function POS({ auth, products }) {
    // Tasa BCV (Temporal hasta conectarla a la API real)
    const tasaBCV = 39.50;

    // Estados
    const [cart, setCart] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('Todos');

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
        <div className="bg-background text-on-background min-h-screen relative font-body-md text-body-md antialiased overflow-hidden">
            <Head title="Punto de Venta" />

            {/* TopAppBar */}
            <header className="sticky docked full-width top-0 bg-surface dark:bg-on-background shadow-sm border-b border-outline-variant/30 z-40">
                <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto h-[72px]">
                    <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-primary text-[28px]">icecream</span>
                        <h1 className="font-display-lg text-headline-md font-bold text-primary tracking-tight hidden sm:block">ScoopMaster Pro</h1>
                    </div>
                    <div className="flex items-center">
                        <span className="bg-surface-container-high text-on-surface px-sm py-xs rounded-lg font-label-md text-label-md border border-outline-variant font-bold">
                            BCV: {tasaBCV} Bs
                        </span>
                    </div>
                </div>
            </header>

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

                                    {/* Selected Badge */}
                                    {qty > 0 && (
                                        <div className="absolute top-2 right-2 bg-primary text-on-primary w-6 h-6 rounded-full flex items-center justify-center font-label-md text-[12px] shadow-sm font-bold">
                                            {qty}
                                        </div>
                                    )}
                                </div>
                                <div className="px-xs pb-xs flex-grow flex flex-col justify-between">
                                    <h3 className="font-headline-sm text-body-md font-bold leading-tight line-clamp-2 mb-1 text-gray-800">{product.name}</h3>
                                    <p className="font-label-md text-primary font-black">${precioUSD}</p>
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

            {/* BottomNavBar */}
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-container border-t border-outline-variant shadow-lg rounded-t-xl pb-6 sm:pb-2">
                <Link href={route('dashboard')} className="flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:bg-surface-container-highest transition-all rounded-lg px-4 py-1">
                    <span className="material-symbols-outlined text-[24px]">dashboard</span>
                    <span className="font-label-md text-[10px] font-bold mt-1">Resumen</span>
                </Link>
                <Link href={route('pos')} className="flex flex-col items-center justify-center bg-secondary-container text-on-surface-variant rounded-full px-6 py-1">
                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>point_of_sale</span>
                    <span className="font-label-md text-[10px] font-bold mt-1">Venta</span>
                </Link>
                <Link href={route('products.index')} className="flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:bg-surface-container-highest transition-all rounded-lg px-4 py-1">
                    <span className="material-symbols-outlined text-[24px]">inventory_2</span>
                    <span className="font-label-md text-[10px] font-bold mt-1">Inventario</span>
                </Link>
            </nav>

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
                                    <div className="flex items-center gap-sm">
                                        <div className="bg-surface-container-highest rounded-md w-10 h-10 flex items-center justify-center font-label-md text-on-surface font-black">
                                            x{item.quantity}
                                        </div>
                                        <div>
                                            <p className="font-body-md text-on-surface font-bold">{item.product.name}</p>
                                            <p className="font-body-sm text-on-surface-variant">${(item.product.price / tasaBCV).toFixed(2)} c/u</p>
                                        </div>
                                    </div>
                                    <p className="font-body-md text-on-surface font-black">
                                        ${((item.product.price / tasaBCV) * item.quantity).toFixed(2)}
                                    </p>
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
                                    alert('Aquí enviaremos la orden a la base de datos');
                                    setCart([]);
                                    setIsModalOpen(false);
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
        </div>
    );
}