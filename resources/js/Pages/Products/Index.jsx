import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import CategoryManagerModal from '@/Components/CategoryManagerModal';
import Dropdown from '@/Components/Dropdown';

export default function Index({ auth, products, categories = [], restockHistory = [] }) {
    const { tasa_bcv } = usePage().props;
    const tasaBCV = Number(tasa_bcv);

    const catsList = useMemo(() => Array.isArray(categories) ? categories : Object.values(categories || {}), [categories]);

    const [editingId, setEditingId] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [toast, setToast] = useState('');

    // --- ESTADOS DE SELECCIÓN Y EDICIÓN MASIVA ---
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [bulkPriceBs, setBulkPriceBs] = useState('');
    const [bulkPriceUsd, setBulkPriceUsd] = useState('');
    const [bulkStock, setBulkStock] = useState('');

    // --- ESTADOS DE NUEVA REPOSICIÓN (CARRITO INVERTIDO & ESTIMACIÓN DUAL) ---
    const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
    const [isConfirmMode, setIsConfirmMode] = useState(false); // false: Borrador / Estimación, true: Confirmar Factura
    const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
    const [restockSearch, setRestockSearch] = useState('');
    const [restockCart, setRestockCart] = useState([]);
    const [restockTotalUsd, setRestockTotalUsd] = useState('');
    const [restockTotalBs, setRestockTotalBs] = useState('');

    // --- FORMULARIO RÁPIDO PARA CREAR PRODUCTO DESDE REPOSICIÓN ---
    const { data: quickData, setData: setQuickData, post: postQuick, processing: processingQuick, reset: resetQuick, errors: errorsQuick } = useForm({
        name: '', stock: 0, price_bs: '', price_usd: '', cost_usd: '', cost_bs: '', category_id: catsList.length > 0 ? catsList[0].id : 1,
    });

    const submitQuickCreate = (e) => {
        e.preventDefault();
        postQuick(route('products.store'), {
            onSuccess: (page) => {
                setIsQuickCreateOpen(false);
                const costVal = quickData.cost_usd || '0';
                showToast('¡Producto registrado exitosamente!');
                resetQuick();
            }
        });
    };

    // --- ESTADOS DE HISTÓRICO DE REPOSICIONES ---
    const [isRestockHistorySidebarOpen, setIsRestockHistorySidebarOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(null);

    // --- BÚSQUEDA Y ORDENAMIENTO ---
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [sortBy, setSortBy] = useState(() => localStorage.getItem('ik_inventory_sort') || 'name_asc');
    const [showOutOfStock, setShowOutOfStock] = useState(() => localStorage.getItem('ik_inventory_show_out_of_stock') !== 'false');

    useEffect(() => localStorage.setItem('ik_inventory_sort', sortBy), [sortBy]);
    useEffect(() => localStorage.setItem('ik_inventory_show_out_of_stock', showOutOfStock), [showOutOfStock]);

    // --- ESCAPE KEYLISTENER PARA CERRAR CUALQUIER MODAL ABIERTO ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (isCategoryModalOpen) setIsCategoryModalOpen(false);
                else if (productToDelete) setProductToDelete(null);
                else if (editingId) setEditingId(null);
                else if (isCreateModalOpen) setIsCreateModalOpen(false);
                else if (isBulkEditModalOpen) setIsBulkEditModalOpen(false);
                else if (isBulkDeleteModalOpen) setIsBulkDeleteModalOpen(false);
                else if (isRestockModalOpen) setIsRestockModalOpen(false);
                else if (isRestockHistorySidebarOpen) setIsRestockHistorySidebarOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        isCategoryModalOpen, productToDelete, editingId, isCreateModalOpen,
        isBulkEditModalOpen, isBulkDeleteModalOpen, isRestockModalOpen, isRestockHistorySidebarOpen
    ]);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(''), 3000);
    };

    // --- CORRECCIÓN MATEMÁTICA ---
    const sanitizeDecimal = (val) => {
        let v = String(val).replace(',', '.');
        v = v.replace(/[^0-9.]/g, '');
        const parts = v.split('.');
        if (parts.length > 2) {
            v = parts[0] + '.' + parts.slice(1).join('');
        }
        return v;
    };

    const sanitizeInteger = (val) => String(val).replace(/\D/g, '');

    // --- CREAR NUEVO PRODUCTO (MODAL GLOBAL) ---
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '', stock: '', price_bs: '', price_usd: '', cost_usd: '', category_id: 1,
    });

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('products.store'), {
            onSuccess: () => { setIsCreateModalOpen(false); reset(); showToast('¡Producto registrado!'); }
        });
    };

    // --- LÓGICA DE REPOSICIÓN ---
    const addToRestock = (product) => {
        setRestockCart(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) {
                return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            const defaultCost = (product.cost_usd !== undefined && product.cost_usd !== null) ? String(product.cost_usd) : '0';
            return [...prev, { product, quantity: 1, cost_usd: defaultCost }];
        });
    };

    const updateRestockQty = (id, newQty) => {
        const qty = parseInt(newQty, 10);
        if (isNaN(qty) || qty <= 0) {
            if (qty === 0) removeFromRestock(id);
            return;
        }
        setRestockCart(prev => prev.map(i => i.product.id === id ? { ...i, quantity: qty } : i));
    };

    const updateRestockCost = (id, newCost) => {
        setRestockCart(prev => prev.map(i => i.product.id === id ? { ...i, cost_usd: newCost } : i));
    };

    const removeFromRestock = (id) => setRestockCart(prev => prev.filter(i => i.product.id !== id));

    const clearRestockCart = () => {
        setRestockCart([]);
        setRestockTotalUsd('');
        setRestockTotalBs('');
        setIsConfirmMode(false);
    };

    // Recálculo automático de totales estimados en USD y Bs
    useEffect(() => {
        if (!isRestockModalOpen) return;
        if (restockCart.length === 0) {
            setRestockTotalUsd('');
            setRestockTotalBs('');
            return;
        }
        const totalUsdCalc = restockCart.reduce((sum, item) => {
            const qty = Number(item.quantity) || 0;
            const cost = Number(item.cost_usd) || 0;
            return sum + (qty * cost);
        }, 0);

        setRestockTotalUsd(totalUsdCalc.toFixed(2));
        setRestockTotalBs((totalUsdCalc * tasaBCV).toFixed(2));
    }, [restockCart, tasaBCV, isRestockModalOpen]);

    const submitRestock = () => {
        if (!isConfirmMode) {
            showToast('Activa el modo "Confirmar Factura" para guardar');
            return;
        }

        router.post(route('products.restock'), {
            total_usd: restockTotalUsd || 0,
            total_bs: restockTotalBs || 0,
            items: restockCart.map(i => ({
                product_id: i.product.id,
                quantity: i.quantity,
                cost_usd: i.cost_usd !== '' ? Number(i.cost_usd) : null
            }))
        }, {
            onSuccess: () => {
                setIsRestockModalOpen(false);
                clearRestockCart();
                showToast('¡Factura de reposición guardada e inventario actualizado!');
            }
        });
    };

    // --- ACCIONES MASIVAS ---
    const toggleSelection = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    const toggleAll = () => setSelectedIds(selectedIds.length > 0 ? [] : productosProcesados.map(p => p.id));

    const handleBulkEdit = () => {
        router.post(route('products.bulkUpdate'), {
            ids: selectedIds,
            price_bs: bulkPriceBs !== '' ? bulkPriceBs : null,
            price_usd: bulkPriceUsd !== '' ? bulkPriceUsd : null,
            cost_usd: bulkCostUsd !== '' ? bulkCostUsd : null,
            stock: bulkStock !== '' ? bulkStock : null
        }, {
            onSuccess: () => {
                setSelectedIds([]);
                setBulkPriceBs('');
                setBulkPriceUsd('');
                setBulkCostUsd('');
                setBulkStock('');
                setIsBulkEditModalOpen(false);
                showToast('Actualizado masivamente!');
            }
        });
    };

    const handleBulkDelete = () => {
        router.post(route('products.bulkDestroy'), { ids: selectedIds }, {
            onSuccess: () => { setSelectedIds([]); setIsBulkDeleteModalOpen(false); showToast('Productos eliminados!'); }
        });
    };

    // --- ORDENAMIENTO Y FILTRADO (OPTIMIZADO CON USEMEMO) ---
    const productosProcesados = useMemo(() => {
        let filtrados = [...products];

        if (!showOutOfStock) {
            filtrados = filtrados.filter(p => Number(p.stock) > 0);
        }

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtrados = filtrados.filter(p => p.name.toLowerCase().includes(query));
        }

        return filtrados.sort((a, b) => {
            const sA = Number(a.stock), sB = Number(b.stock);
            if (sA <= 0 && sB > 0) return 1;
            if (sA > 0 && sB <= 0) return -1;
            if (sA <= 0 && sB <= 0) return a.name.localeCompare(b.name);
            if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
            if (sortBy === 'category') return (a.category?.name || '').localeCompare(b.category?.name || '');
            if (sortBy === 'price_desc') return Number(b.price_usd) - Number(a.price_usd);
            if (sortBy === 'price_asc') return Number(a.price_usd) - Number(b.price_usd);
            if (sortBy === 'stock_desc') return sB - sA;
            if (sortBy === 'stock_asc') return sA - sB;
            return 0;
        });
    }, [products, showOutOfStock, searchQuery, sortBy]);

    const formatTime = (dateString) => new Date(dateString).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
    const formatMoney = (val) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(val);

    return (
        <MainLayout>
            <div className="bg-background dark:bg-dark-background text-on-background dark:text-dark-on-surface font-body-md min-h-screen flex flex-col pb-[120px] md:pb-24 transition-colors">
                <Head title="Inventario" />

                <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-margin-desktop py-6 md:py-8 relative">

                    {/* ENCABEZADO Y CONTROLES: RESPONSIVE, ESTRICTO Y CERO ESPACIOS VACÍOS */}
                    <div className="flex flex-col lg:flex-row w-full gap-2 lg:gap-4 mb-6">
                        {/* Bloque Izquierdo: Botones de Acción (Grid en móvil, Flex en escritorio) */}
                        <div className={`grid grid-cols-4 lg:flex lg:flex-row gap-2 ${isSearchActive ? 'hidden lg:flex' : 'flex'}`}>
                            <button onClick={() => setIsRestockHistorySidebarOpen(true)} className="group flex items-center justify-center gap-1 lg:gap-2 rounded-xl border border-outline-variant dark:border-dark-outline text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-high dark:hover:bg-dark-surface-container transition-colors bg-surface dark:bg-dark-surface h-[44px] lg:px-4">
                                <span className="material-symbols-outlined text-[20px] lg:text-[18px]">history</span>
                                <span className="hidden lg:inline text-xs font-black uppercase tracking-wider">Histórico</span>
                            </button>
                            <button onClick={() => setIsCategoryModalOpen(true)} className="group flex items-center justify-center gap-1 lg:gap-2 rounded-xl border border-outline-variant dark:border-dark-outline text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-high dark:hover:bg-dark-surface-container transition-colors bg-surface dark:bg-dark-surface h-[44px] lg:px-4">
                                <span className="material-symbols-outlined text-[20px] lg:text-[18px]">category</span>
                                <span className="hidden lg:inline text-xs font-black uppercase tracking-wider">Categorías</span>
                            </button>
                            <button onClick={() => setIsCreateModalOpen(true)} className="group flex items-center justify-center gap-1 lg:gap-2 rounded-xl border border-outline-variant dark:border-dark-outline text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-high dark:hover:bg-dark-surface-container transition-colors bg-surface dark:bg-dark-surface h-[44px] lg:px-4">
                                <span className="material-symbols-outlined text-[20px] lg:text-[18px]">add</span>
                                <span className="hidden lg:inline text-xs font-black uppercase tracking-wider">Producto</span>
                            </button>
                            <button onClick={() => setIsRestockModalOpen(true)} className="group flex items-center justify-center gap-1 lg:gap-2 bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background hover:opacity-90 transition-all rounded-xl shadow-sm border dark:border-dark-primary/20 h-[44px] lg:px-4">
                                <span className="material-symbols-outlined text-[20px] lg:text-[18px]">inventory_2</span>
                                <span className="hidden lg:inline text-xs font-black uppercase tracking-wider">Reposición</span>
                            </button>
                        </div>

                        {/* Bloque Búsqueda Central (Solo Escritorio): Llena el "Espacio Gigante" */}
                        <div className="hidden lg:flex flex-1 relative items-center h-[44px] bg-surface dark:bg-dark-surface border border-outline-variant dark:border-dark-outline rounded-xl overflow-hidden transition-all shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                            <span className="material-symbols-outlined absolute left-[12px] text-[22px] text-on-surface-variant dark:text-dark-on-surface-variant pointer-events-none">search</span>
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-full pl-[44px] pr-[40px] bg-transparent border-none outline-none text-sm focus:ring-0 text-on-surface dark:text-dark-on-surface placeholder:text-on-surface-variant/70 dark:placeholder:text-dark-on-surface-variant/70 transition-colors"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-[8px] w-[28px] h-[28px] flex items-center justify-center rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            )}
                        </div>

                        {/* Bloque Derecho: Filtros y Búsqueda Móvil */}
                        <div className={`grid grid-cols-4 lg:flex lg:flex-row gap-2 w-full lg:w-auto`}>

                            {/* MOBILE ACTIVE SEARCH */}
                            {isSearchActive && (
                                <div className="col-span-4 lg:hidden relative flex items-center w-full h-[44px] bg-surface dark:bg-dark-surface border border-primary dark:border-dark-primary rounded-xl overflow-hidden shadow-sm shadow-primary/10 ring-1 ring-primary/20">
                                    <span className="material-symbols-outlined absolute left-[12px] text-[22px] text-primary pointer-events-none">search</span>
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder="Escribe para buscar..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-full pl-[44px] pr-[44px] bg-transparent border-none outline-none text-sm focus:ring-0 text-on-surface dark:text-dark-on-surface placeholder:text-on-surface-variant/70 transition-colors"
                                    />
                                    <button onClick={() => { setIsSearchActive(false); setSearchQuery(''); }} className="absolute right-[8px] w-[28px] h-[28px] flex items-center justify-center rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors">
                                        <span className="material-symbols-outlined text-[18px]">close</span>
                                    </button>
                                </div>
                            )}

                            {/* FILTROS (Visible siempre en Desktop, Ocultos en Mobile si Search está activo) */}
                            <div className={`col-span-4 grid grid-cols-4 lg:flex lg:flex-row gap-2 ${isSearchActive ? 'hidden lg:flex' : 'flex'}`}>

                                {/* Seleccionar Todo */}
                                {productosProcesados.length > 0 ? (
                                    <button onClick={toggleAll} className={`group relative flex items-center justify-center h-[44px] lg:w-[44px] rounded-xl border transition-colors ${selectedIds.length > 0 ? 'border-primary dark:border-dark-primary text-primary dark:text-dark-primary bg-primary/10 dark:bg-dark-primary/10' : 'border-outline-variant dark:border-dark-outline text-on-surface-variant dark:text-dark-on-surface-variant bg-surface dark:bg-dark-surface hover:bg-surface-container-high dark:hover:bg-dark-surface-container'}`}>
                                        <span className="material-symbols-outlined text-[22px]">{selectedIds.length > 0 ? 'check_box' : 'check_box_outline_blank'}</span>
                                        <span className="absolute hidden lg:block top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none z-50 whitespace-nowrap">{selectedIds.length > 0 ? 'Deseleccionar' : 'Seleccionar Todo'}</span>
                                    </button>
                                ) : (
                                    <div className="block lg:hidden"></div>
                                )}

                                {/* Botón Activar Buscador (SOLO MÓVIL) */}
                                <button onClick={() => setIsSearchActive(true)} className={`lg:hidden flex items-center justify-center h-[44px] rounded-xl border border-outline-variant dark:border-dark-outline text-on-surface-variant dark:text-dark-on-surface-variant bg-surface dark:bg-dark-surface hover:bg-surface-container-high dark:hover:bg-dark-surface-container transition-colors ${productosProcesados.length === 0 ? 'col-start-2' : ''}`}>
                                    <span className="material-symbols-outlined text-[22px]">search</span>
                                </button>

                                {/* Ocultar Agotados */}
                                <button onClick={() => setShowOutOfStock(!showOutOfStock)} className={`group relative flex items-center justify-center h-[44px] lg:w-[44px] rounded-xl border transition-colors ${!showOutOfStock ? 'border-primary dark:border-dark-primary text-primary dark:text-dark-primary bg-primary/10 dark:bg-dark-primary/10' : 'border-outline-variant dark:border-dark-outline text-on-surface-variant dark:text-dark-on-surface-variant bg-surface dark:bg-dark-surface hover:bg-surface-container-high dark:hover:bg-dark-surface-container'}`}>
                                    <span className="material-symbols-outlined text-[22px]">{!showOutOfStock ? 'visibility_off' : 'visibility'}</span>
                                    <span className="absolute hidden lg:block top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none z-50 whitespace-nowrap">{!showOutOfStock ? "Mostrar Agotados" : "Ocultar Agotados"}</span>
                                </button>

                                {/* Ordenamiento (Fijado sin deformación) */}
                                <div className="relative flex items-center justify-center h-[44px] lg:w-[44px] rounded-xl border border-outline-variant dark:border-dark-outline bg-surface dark:bg-dark-surface hover:bg-surface-container-high dark:hover:bg-dark-surface-container transition-colors group">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <div className="absolute inset-0 flex items-center justify-center w-full h-full cursor-pointer rounded-xl">
                                                <span className="material-symbols-outlined text-[22px] text-on-surface-variant dark:text-dark-on-surface-variant group-hover:text-on-surface dark:group-hover:text-dark-on-surface">sort</span>
                                            </div>
                                        </Dropdown.Trigger>
                                        <Dropdown.Content align="right" width="48" contentClasses="py-1 bg-surface dark:bg-dark-surface rounded-xl border border-outline-variant/50 dark:border-dark-outline/50 shadow-lg mt-12 z-50">
                                            <button onClick={() => setSortBy('name_asc')} className={`block w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${sortBy === 'name_asc' ? 'text-primary dark:text-dark-primary bg-primary/5' : 'text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-high dark:hover:bg-dark-surface-container'}`}>Alfabético</button>
                                            <button onClick={() => setSortBy('category')} className={`block w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors border-t border-outline-variant/10 ${sortBy === 'category' ? 'text-primary dark:text-dark-primary bg-primary/5' : 'text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-high dark:hover:bg-dark-surface-container'}`}>Categoría</button>
                                            <button onClick={() => setSortBy('price_desc')} className={`block w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors border-t border-outline-variant/10 ${sortBy === 'price_desc' ? 'text-primary dark:text-dark-primary bg-primary/5' : 'text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-high dark:hover:bg-dark-surface-container'}`}>Mayor Precio</button>
                                            <button onClick={() => setSortBy('price_asc')} className={`block w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors border-t border-outline-variant/10 ${sortBy === 'price_asc' ? 'text-primary dark:text-dark-primary bg-primary/5' : 'text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-high dark:hover:bg-dark-surface-container'}`}>Menor Precio</button>
                                            <button onClick={() => setSortBy('stock_desc')} className={`block w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors border-t border-outline-variant/10 ${sortBy === 'stock_desc' ? 'text-primary dark:text-dark-primary bg-primary/5' : 'text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-high dark:hover:bg-dark-surface-container'}`}>Mayor Stock</button>
                                            <button onClick={() => setSortBy('stock_asc')} className={`block w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors border-t border-outline-variant/10 ${sortBy === 'stock_asc' ? 'text-primary dark:text-dark-primary bg-primary/5' : 'text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-high dark:hover:bg-dark-surface-container'}`}>Menor Stock</button>
                                        </Dropdown.Content>
                                    </Dropdown>
                                    <span className="absolute hidden lg:block top-full mt-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none z-50 whitespace-nowrap">Ordenar</span>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* GRILLA DE PRODUCTOS (PUNTO 4 CORREGIDO: EDICIÓN INLINE ELIMINADA) */}
                    {productosProcesados.length === 0 ? (
                        <div className="text-center p-12 mt-4 border border-dashed border-outline-variant dark:border-dark-outline rounded-2xl bg-surface-container-lowest dark:bg-dark-background/40">
                            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/50 dark:text-dark-on-surface-variant/50 mb-4 block">inventory_2</span>
                            <p className="text-on-surface-variant dark:text-dark-on-surface-variant font-bold text-lg">No se encontraron productos.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                            {productosProcesados.map(product => {
                                const currentStock = Number(product.stock);
                                const isOutOfStock = currentStock === 0;
                                const isLowStock = currentStock > 0 && currentStock <= 2;
                                const isSelected = selectedIds.includes(product.id);
                                const precioUSD = Number(product.price_usd).toFixed(2);
                                const costoUSD = Number(product.cost_usd || 0).toFixed(2);
                                const precioBs = (Number(product.price_usd) * tasaBCV).toFixed(2);

                                return (
                                    <div key={product.id} className={`bg-surface dark:bg-dark-surface border rounded-xl p-3 md:p-4 flex flex-col relative shadow-sm hover:shadow-md select-none transition-all duration-300 ${isSelected ? 'border-primary ring-1 ring-primary dark:border-dark-primary dark:ring-dark-primary' : isOutOfStock ? 'border-error/30 dark:border-error/30 opacity-70 grayscale-[0.4]' : isLowStock ? 'border-orange-500/50 dark:border-orange-500/50' : 'border-outline-variant dark:border-dark-outline'}`}>
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${isOutOfStock ? 'bg-error' : isLowStock ? 'bg-orange-500' : isSelected ? 'bg-primary dark:bg-dark-primary' : 'bg-transparent'}`}></div>
                                        <div className={`w-full aspect-square rounded-lg mb-3 overflow-hidden relative transition-colors border group ${isOutOfStock ? 'bg-surface-container-highest dark:bg-[#1f1f1f] border-error/20' : isLowStock ? 'bg-orange-50 dark:bg-[#2d1b0a] border-orange-500/20' : 'bg-blue-50 dark:bg-dark-background border-outline-variant/50 dark:border-dark-outline/50'}`}>
                                            <div className={`w-full h-full flex items-center justify-center ${isOutOfStock ? 'text-error/40' : isLowStock ? 'text-orange-400' : 'text-blue-400 dark:text-blue-500'}`}>
                                                <span className="material-symbols-outlined opacity-80 text-[48px]">{product.category?.icon || 'icecream'}</span>
                                            </div>
                                            <div className="absolute top-2 left-2 z-10">
                                                <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(product.id)} className="w-4 h-4 rounded border-outline-variant dark:border-dark-outline text-primary dark:text-dark-primary focus:ring-primary dark:focus:ring-dark-primary dark:bg-dark-background dark:checked:bg-dark-primary dark:checked:border-dark-primary cursor-pointer transition-colors" />
                                            </div>
                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] hidden md:flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setEditingId(product.id)} className="w-8 h-8 bg-surface dark:bg-dark-surface text-on-surface dark:text-white rounded-full flex items-center justify-center hover:text-primary dark:hover:text-dark-primary transition-colors shadow-md">
                                                    <span className="material-symbols-outlined text-[16px]">edit_square</span>
                                                </button>
                                                <button onClick={() => setProductToDelete(product)} className="w-8 h-8 bg-error text-onError rounded-full flex items-center justify-center hover:bg-error/90 transition-colors shadow-md">
                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex-grow flex flex-col justify-between pl-1">
                                            <h3 className={`font-headline-sm text-body-md font-bold leading-tight line-clamp-2 mb-2 uppercase tracking-tight text-xs ${isOutOfStock ? 'text-error/80' : 'text-gray-800 dark:text-dark-on-surface'}`}>
                                                {product.name}
                                            </h3>
                                            <div className="flex items-center gap-1 mb-2">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${isOutOfStock ? 'text-error' : isLowStock ? 'text-orange-500' : 'text-on-surface-variant dark:text-dark-on-surface-variant'}`}>Stock:</span>
                                                <span className={`text-sm font-bold leading-none ${isOutOfStock ? 'text-error' : isLowStock ? 'text-orange-500' : 'text-on-surface dark:text-white'}`}>{product.stock}</span>
                                            </div>
                                            <div className="flex flex-col mt-auto border-t border-outline-variant/30 dark:border-dark-outline pt-2">
                                                <div className="flex justify-between items-baseline">
                                                    <p className="font-label-md text-primary dark:text-dark-primary font-black tracking-tighter text-sm">${precioUSD}</p>
                                                    <p className="font-label-sm text-on-surface-variant dark:text-dark-on-surface-variant text-[9px] font-bold">Costo: ${costoUSD}</p>
                                                </div>
                                                <p className="font-label-sm text-on-surface-variant dark:text-dark-on-surface-variant font-bold text-[10px]">{precioBs} Bs</p>
                                            </div>
                                            <div className="flex md:hidden items-center gap-2 mt-3 pt-3 border-t border-outline-variant/30 dark:border-dark-outline">
                                                <button onClick={() => setEditingId(product.id)} className="flex-1 py-1.5 text-on-surface-variant dark:text-dark-on-surface-variant bg-surface-container-low dark:bg-dark-background rounded-md transition-colors border dark:border-dark-outline flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[16px]">edit_square</span>
                                                </button>
                                                <button onClick={() => setProductToDelete(product)} className="flex-1 py-1.5 text-error/80 bg-error/10 dark:bg-error/5 rounded-md transition-colors border dark:border-error/20 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>

                {/* ACCIONES MASIVAS */}
                {selectedIds.length > 0 && (
                    <div className="fixed bottom-[80px] md:bottom-md left-0 w-full px-4 md:px-margin-desktop z-40 flex justify-center animate-fade-in">
                        <div className="w-full max-w-2xl bg-surface dark:bg-dark-surface shadow-2xl rounded-2xl border dark:border-dark-outline p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background flex items-center justify-center font-black text-sm">
                                    {selectedIds.length}
                                </div>
                                <span className="font-bold text-on-surface dark:text-white uppercase tracking-wider text-sm">Seleccionados</span>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button onClick={() => setIsBulkEditModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-surface-container-high dark:bg-dark-background hover:bg-primary hover:text-on-primary dark:hover:bg-dark-primary dark:hover:text-dark-background text-on-surface dark:text-white px-4 py-2 rounded-lg font-black text-xs uppercase transition-all border dark:border-dark-outline">
                                    <span className="material-symbols-outlined text-[16px]">edit_square</span>Editar
                                </button>
                                <button onClick={() => setIsBulkDeleteModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-error/10 dark:bg-error/20 hover:bg-error text-error hover:text-onError px-4 py-2 rounded-lg font-black text-xs uppercase transition-all border border-error/20">
                                    <span className="material-symbols-outlined text-[16px]">delete</span>Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* =========================================================
                NUEVOS MODALES: REPOSICIÓN DE INVENTARIO Y SU HISTÓRICO
            ========================================================= */}

            {/* MODAL: REPOSICIÓN DE INVENTARIO CON ESTIMACIÓN DUAL Y CREACIÓN RÁPIDA */}
            {isRestockModalOpen && (
                <div
                    onClick={(e) => { if (e.target === e.currentTarget) setIsRestockModalOpen(false); }}
                    className="fixed inset-0 bg-black/90 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-fade-in transition-all"
                >
                    <div className="bg-surface-container-lowest dark:bg-dark-surface w-full h-full md:h-[92vh] md:max-w-5xl shadow-2xl border dark:border-dark-outline flex flex-col overflow-hidden md:rounded-xl">

                        {/* Cabecera Adaptada para Móviles <= 375px (Filas ordenadas, sin desbordamiento) */}
                        <div className="px-3 py-2 border-b border-outline-variant/50 dark:border-dark-outline flex flex-col md:flex-row md:items-center justify-between gap-2 bg-surface-bright dark:bg-dark-surface-container shrink-0">
                            <div className="flex items-center justify-between w-full md:w-auto gap-2">
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="material-symbols-outlined text-primary dark:text-dark-primary text-[20px] md:text-[24px]">inventory_2</span>
                                    <h3 className="font-headline-md text-on-surface dark:text-dark-on-surface font-black uppercase text-[11px] md:text-sm tracking-wider truncate">
                                        Reposición
                                    </h3>
                                </div>

                                {/* Botones de acción en móvil (Vaciar icon + Cerrar X) */}
                                <div className="flex md:hidden items-center gap-1 shrink-0">
                                    {restockCart.length > 0 && (
                                        <button onClick={clearRestockCart} title="Vaciar Lista" className="text-[10px] font-black uppercase tracking-widest text-error hover:text-error/80 transition-colors flex items-center justify-center gap-1 bg-error/10 p-1.5 rounded-lg border border-error/20">
                                            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                                        </button>
                                    )}
                                    <button onClick={() => setIsRestockModalOpen(false)} title="Cerrar" className="p-1.5 text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">close</span>
                                    </button>
                                </div>
                            </div>

                            {/* TOGGLE SWITCH SIMPLIFICADO: 100% Ancho en Móvil (<= 375px), Auto en Desktop */}
                            <div className="flex items-center gap-1 bg-surface dark:bg-dark-background p-1 rounded-xl border border-outline-variant/50 dark:border-dark-outline select-none shadow-inner w-full md:w-auto">
                                <button
                                    type="button"
                                    onClick={() => setIsConfirmMode(false)}
                                    className={`flex-1 md:flex-initial px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${!isConfirmMode ? 'bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background shadow-md' : 'text-on-surface-variant dark:text-dark-on-surface-variant hover:text-on-surface'}`}
                                >
                                    <span className="material-symbols-outlined text-[14px]">edit_note</span>
                                    Estimación
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsConfirmMode(true)}
                                    className={`flex-1 md:flex-initial px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${isConfirmMode ? 'bg-emerald-500 text-white shadow-md' : 'text-on-surface-variant dark:text-dark-on-surface-variant hover:text-on-surface'}`}
                                >
                                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                    Facturar
                                </button>
                            </div>

                            {/* Botones de acción en Desktop */}
                            <div className="hidden md:flex items-center gap-1.5 shrink-0">
                                {restockCart.length > 0 && (
                                    <button onClick={clearRestockCart} title="Vaciar Lista" className="text-[10px] font-black uppercase tracking-widest text-error hover:text-error/80 transition-colors flex items-center justify-center gap-1 bg-error/10 px-2.5 py-1.5 rounded-lg border border-error/20 hover:bg-error/20">
                                        <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                                        <span>Vaciar</span>
                                    </button>
                                )}
                                <button onClick={() => setIsRestockModalOpen(false)} title="Cerrar" className="p-1.5 text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-colors">
                                    <span className="material-symbols-outlined text-[22px]">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Contenido dividido: Columna en móvil, Fila en Desktop */}
                        <div className="flex flex-col md:flex-row flex-grow overflow-hidden relative">

                            {/* Lado Izquierdo: Catálogo y Búsqueda + Formulario de Creación Rápida */}
                            <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-outline-variant/30 dark:border-dark-outline flex flex-col h-[40vh] md:h-full shrink-0 md:shrink bg-surface-container-lowest dark:bg-dark-background/40">

                                {/* Top Header del lado izquierdo: Buscar y Botón Crear Producto Rápido */}
                                <div className="p-3 border-b border-outline-variant/30 dark:border-dark-outline bg-surface dark:bg-dark-surface/60 flex items-center justify-between gap-2 shrink-0">
                                    {!isQuickCreateOpen ? (
                                        <>
                                            <div className="relative flex-1">
                                                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">search</span>
                                                <input
                                                    type="text"
                                                    placeholder="Buscar producto..."
                                                    value={restockSearch}
                                                    onChange={(e) => setRestockSearch(e.target.value)}
                                                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-outline-variant dark:border-dark-outline bg-surface-container-low dark:bg-dark-background text-on-surface dark:text-white font-bold focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                            <button
                                                onClick={() => setIsQuickCreateOpen(true)}
                                                className="px-2.5 py-1.5 bg-primary/10 dark:bg-dark-primary/10 text-primary dark:text-dark-primary hover:bg-primary/20 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors border border-primary/20 dark:border-dark-primary/30 flex items-center gap-1 shrink-0"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">add</span>
                                                Nuevo
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-xs font-black uppercase tracking-wider text-primary dark:text-dark-primary flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">add_circle</span> Crear Producto Rápido
                                            </span>
                                            <button
                                                onClick={() => setIsQuickCreateOpen(false)}
                                                className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-error transition-colors flex items-center gap-0.5"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">arrow_back</span> Volver
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Cuerpo del Lado Izquierdo: Grilla de Productos Ordenados A-Z o Formulario Compacto */}
                                {!isQuickCreateOpen ? (
                                    <div className="p-3 overflow-y-auto flex-grow custom-scrollbar">
                                        <div className="grid grid-cols-2 gap-2">
                                            {products
                                                .filter(p => p.name.toLowerCase().includes(restockSearch.toLowerCase()))
                                                .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
                                                .map(p => {
                                                    const costVal = Number(p.cost_usd || 0).toFixed(2);
                                                    return (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => addToRestock(p)}
                                                            className="text-left p-2.5 bg-surface dark:bg-dark-surface border border-outline-variant/40 dark:border-dark-outline rounded-xl hover:border-primary dark:hover:border-dark-primary transition-all flex flex-col justify-between gap-1 group shadow-sm hover:shadow"
                                                        >
                                                            <span className="text-[11px] font-bold uppercase text-on-surface dark:text-white truncate w-full group-hover:text-primary dark:group-hover:text-dark-primary">{p.name}</span>
                                                            <div className="flex justify-between items-center w-full mt-1 border-t border-outline-variant/20 dark:border-dark-outline/30 pt-1">
                                                                <span className="text-[9px] font-bold text-on-surface-variant dark:text-dark-on-surface-variant">Stock: {p.stock}</span>
                                                                <span className="text-[9px] font-black text-primary dark:text-dark-primary">${costVal}</span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={submitQuickCreate} className="p-4 overflow-y-auto flex-grow flex flex-col gap-3 custom-scrollbar">
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant block mb-1">Nombre / Sabor *</label>
                                            <input
                                                type="text" required
                                                value={quickData.name}
                                                onChange={e => setQuickData('name', e.target.value)}
                                                placeholder="Ej. Torta Helada Especial"
                                                className="w-full text-xs font-bold p-2 rounded-lg border border-outline-variant dark:border-dark-outline bg-surface dark:bg-dark-surface text-on-surface dark:text-white"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant block mb-1">Categoría</label>
                                                <select
                                                    value={quickData.category_id}
                                                    onChange={e => setQuickData('category_id', e.target.value)}
                                                    className="w-full text-xs font-bold p-2 rounded-lg border border-outline-variant dark:border-dark-outline bg-surface dark:bg-dark-surface text-on-surface dark:text-white"
                                                >
                                                    {catsList.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant block mb-1">Stock Inicial</label>
                                                <input
                                                    type="text" inputMode="numeric"
                                                    value={quickData.stock}
                                                    onChange={e => setQuickData('stock', sanitizeInteger(e.target.value))}
                                                    className="w-full text-xs font-bold p-2 rounded-lg border border-outline-variant dark:border-dark-outline bg-surface dark:bg-dark-surface text-on-surface dark:text-white"
                                                />
                                            </div>
                                        </div>

                                        {/* COSTO AL MAYOR BI-MONEDA ($ Y BS) */}
                                        <div className="grid grid-cols-2 gap-2 border-t border-outline-variant/30 dark:border-dark-outline/30 pt-2">
                                            <div>
                                                <label className="text-[9px] font-black uppercase tracking-widest text-primary dark:text-dark-primary block mb-1">Costo ($) *</label>
                                                <input
                                                    type="text" inputMode="decimal" required placeholder="0.00"
                                                    value={quickData.cost_usd}
                                                    onChange={e => {
                                                        const v = sanitizeDecimal(e.target.value);
                                                        setQuickData(d => ({ ...d, cost_usd: v, cost_bs: v ? (v * tasaBCV).toFixed(2) : '' }));
                                                    }}
                                                    className="w-full text-xs font-black p-2 rounded-lg border border-primary/40 dark:border-dark-primary/40 bg-primary/5 dark:bg-dark-primary/10 text-primary dark:text-dark-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant block mb-1">Costo (Bs)</label>
                                                <input
                                                    type="text" inputMode="decimal" placeholder="0.00"
                                                    value={quickData.cost_bs || ''}
                                                    onChange={e => {
                                                        const v = sanitizeDecimal(e.target.value);
                                                        setQuickData(d => ({ ...d, cost_bs: v, cost_usd: v ? (v / tasaBCV).toFixed(2) : '' }));
                                                    }}
                                                    className="w-full text-xs font-bold p-2 rounded-lg border border-outline-variant dark:border-dark-outline bg-surface dark:bg-dark-surface text-on-surface dark:text-white"
                                                />
                                            </div>
                                        </div>

                                        {/* PRECIO VENTA BI-MONEDA ($ Y BS) */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant block mb-1">Precio Venta ($) *</label>
                                                <input
                                                    type="text" inputMode="decimal" required placeholder="0.00"
                                                    value={quickData.price_usd}
                                                    onChange={e => {
                                                        const v = sanitizeDecimal(e.target.value);
                                                        setQuickData(d => ({ ...d, price_usd: v, price_bs: v ? (v * tasaBCV).toFixed(2) : '' }));
                                                    }}
                                                    className="w-full text-xs font-bold p-2 rounded-lg border border-outline-variant dark:border-dark-outline bg-surface dark:bg-dark-surface text-on-surface dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant block mb-1">Precio Venta (Bs)</label>
                                                <input
                                                    type="text" inputMode="decimal" placeholder="0.00"
                                                    value={quickData.price_bs}
                                                    onChange={e => {
                                                        const v = sanitizeDecimal(e.target.value);
                                                        setQuickData(d => ({ ...d, price_bs: v, price_usd: v ? (v / tasaBCV).toFixed(2) : '' }));
                                                    }}
                                                    className="w-full text-xs font-bold p-2 rounded-lg border border-outline-variant dark:border-dark-outline bg-surface dark:bg-dark-surface text-on-surface dark:text-white"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit" disabled={processingQuick}
                                            className="w-full py-2.5 mt-2 bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background font-black text-xs uppercase tracking-wider rounded-lg shadow hover:opacity-90 transition-all flex justify-center items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">save</span>
                                            Guardar y Agregar
                                        </button>
                                    </form>
                                )}
                            </div>

                            {/* Lado Derecho: Carrito + Estimación / Factura */}
                            <div className="w-full md:w-1/2 flex flex-col flex-grow overflow-hidden bg-surface-container-lowest/50 dark:bg-dark-background/20 relative">

                                {/* Lista de productos a reponer con cantidades y costos al mayor */}
                                <div className="flex-grow overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
                                    {restockCart.length === 0 ? (
                                        <div className="flex-grow flex flex-col items-center justify-center opacity-40 min-h-[160px]">
                                            <span className="material-symbols-outlined text-[36px] text-on-surface-variant mb-2">playlist_add</span>
                                            <p className="text-xs font-bold uppercase tracking-widest text-center">Selecciona o crea productos para armar tu lista de reposición</p>
                                        </div>
                                    ) : (
                                        restockCart.map(item => {
                                            const subtotal = ((Number(item.quantity) || 0) * (Number(item.cost_usd) || 0)).toFixed(2);
                                            return (
                                                <div key={item.product.id} className="p-2.5 rounded-xl border border-outline-variant/40 dark:border-dark-outline bg-surface dark:bg-dark-surface shadow-sm flex flex-col gap-2 shrink-0">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[11px] sm:text-xs font-black uppercase text-on-surface dark:text-white truncate pr-2">{item.product.name}</p>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="text-[11px] font-black text-primary dark:text-dark-primary">${subtotal}</span>
                                                            <button onClick={() => removeFromRestock(item.product.id)} className="w-6 h-6 flex items-center justify-center text-error hover:bg-error/10 rounded transition-colors">
                                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-2 border-t border-outline-variant/20 dark:border-dark-outline/30 pt-2">
                                                        {/* Control de Cantidades */}
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => updateRestockQty(item.product.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center bg-surface-container-high dark:bg-dark-background text-on-surface dark:text-white rounded hover:text-primary transition-colors border dark:border-dark-outline">
                                                                <span className="material-symbols-outlined text-[14px]">remove</span>
                                                            </button>
                                                            <input
                                                                type="text" inputMode="numeric" value={item.quantity}
                                                                onChange={(e) => updateRestockQty(item.product.id, sanitizeInteger(e.target.value))}
                                                                className="w-9 h-6 text-center font-black text-xs bg-transparent border-none focus:ring-0 px-0 text-on-surface dark:text-white"
                                                            />
                                                            <button onClick={() => updateRestockQty(item.product.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-surface-container-high dark:bg-dark-background text-on-surface dark:text-white rounded hover:text-primary transition-colors border dark:border-dark-outline">
                                                                <span className="material-symbols-outlined text-[14px]">add</span>
                                                            </button>
                                                        </div>

                                                        {/* Control de Costo Unitario al Mayor */}
                                                        <div className="flex items-center gap-1 bg-surface-container-low dark:bg-dark-background px-2 py-0.5 rounded border border-outline-variant/30 dark:border-dark-outline">
                                                            <span className="text-[9px] font-bold text-on-surface-variant uppercase">Costo ($):</span>
                                                            <input
                                                                type="text" inputMode="decimal" value={item.cost_usd}
                                                                onChange={(e) => updateRestockCost(item.product.id, sanitizeDecimal(e.target.value))}
                                                                className="w-12 h-6 text-center font-black text-xs bg-transparent border-none focus:ring-0 px-0 text-primary dark:text-dark-primary"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Footer de Totales */}
                                <div className="p-4 bg-surface-container-low dark:bg-dark-background/90 shrink-0 border-t border-outline-variant/30 dark:border-dark-outline shadow-lg md:shadow-none mt-auto">

                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-primary dark:text-dark-primary text-sm">$</span>
                                            <input
                                                type="text" inputMode="decimal" placeholder="0.00"
                                                value={restockTotalUsd}
                                                onChange={e => {
                                                    const v = sanitizeDecimal(e.target.value);
                                                    setRestockTotalUsd(v); setRestockTotalBs(v ? (v * tasaBCV).toFixed(2) : '');
                                                }}
                                                className="w-full pl-6 pr-2 py-2 rounded-lg border border-primary/30 dark:border-dark-primary/30 bg-primary/5 dark:bg-dark-primary/10 text-primary dark:text-dark-primary font-black text-base focus:border-primary focus:ring-0 text-center"
                                            />
                                        </div>
                                        <span className="material-symbols-outlined text-[14px] text-on-surface-variant opacity-50 shrink-0">sync_alt</span>
                                        <div className="relative flex-1">
                                            <input
                                                type="text" inputMode="decimal" placeholder="0.00"
                                                value={restockTotalBs}
                                                onChange={e => {
                                                    const v = sanitizeDecimal(e.target.value);
                                                    setRestockTotalBs(v); setRestockTotalUsd(v ? (v / tasaBCV).toFixed(2) : '');
                                                }}
                                                className="w-full pl-2 pr-6 py-2 rounded-lg border border-outline-variant dark:border-dark-outline bg-surface dark:bg-dark-surface text-on-surface dark:text-white font-black text-base focus:border-primary focus:ring-0 text-center"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-on-surface-variant opacity-50 text-[10px]">Bs</span>
                                        </div>
                                    </div>

                                    {/* BOTÓN DE ACCIÓN ADAPTATIVO AL MODO */}
                                    {!isConfirmMode ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsConfirmMode(true)}
                                            disabled={restockCart.length === 0}
                                            className="w-full py-3 bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:opacity-90 transition-all border dark:border-dark-primary/20 flex justify-center items-center gap-2 disabled:opacity-50"
                                        >
                                            <span>Pasar a Facturar</span>
                                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={submitRestock}
                                            disabled={restockCart.length === 0 || (!restockTotalUsd && !restockTotalBs)}
                                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                            <span>Confirmar y Guardar Factura</span>
                                        </button>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SIDEBAR: HISTÓRICO DE REPOSICIONES (AGRUPADO POR MES) */}
            <div className={`fixed inset-0 z-[110] transition-all duration-300 ${isRestockHistorySidebarOpen ? 'visible' : 'invisible'}`}>
                <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isRestockHistorySidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsRestockHistorySidebarOpen(false)} />
                <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-surface dark:bg-dark-surface shadow-2xl border-l border-outline-variant dark:border-dark-outline transform transition-transform duration-300 flex flex-col ${isRestockHistorySidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="p-6 border-b border-outline-variant dark:border-dark-outline flex justify-between items-center bg-surface-container-low dark:bg-dark-background/50">
                        <div>
                            <h3 className="font-headline-sm font-black text-on-surface dark:text-white uppercase tracking-tighter text-lg">Compras Mensuales</h3>
                            <p className="text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant font-bold uppercase tracking-widest">Inversión en Inventario</p>
                        </div>
                        <button onClick={() => setIsRestockHistorySidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-error/10 text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-all">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-2">
                        {restockHistory.map(month => (
                            <div
                                key={month.id}
                                onClick={() => setSelectedMonth(month)}
                                className="p-4 rounded-xl border border-outline-variant dark:border-dark-outline bg-surface-container-lowest dark:bg-dark-background/40 flex justify-between items-center cursor-pointer hover:border-primary dark:hover:border-dark-primary hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-surface-container dark:bg-dark-surface flex items-center justify-center text-primary dark:text-dark-primary group-hover:scale-110 transition-transform border border-transparent dark:border-dark-outline">
                                        <span className="material-symbols-outlined text-[18px]">inventory</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-xs text-on-surface dark:text-white uppercase tracking-wider group-hover:text-primary dark:group-hover:text-dark-primary transition-colors">{month.month_name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant font-medium">{month.restocks_count} Compras</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="font-black text-sm text-error tracking-tight">-${formatMoney(month.total_usd)}</p>
                                </div>
                            </div>
                        ))}
                        {restockHistory.length === 0 && (
                            <div className="text-center p-8 border border-dashed border-outline-variant dark:border-dark-outline rounded-xl bg-surface-container-lowest dark:bg-dark-surface/30">
                                <p className="text-on-surface-variant dark:text-dark-on-surface-variant font-medium text-sm">Aún no hay compras registradas.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL: DETALLE DEL MES DE REPOSICIÓN */}
            {selectedMonth && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in transition-all">
                    <div className="bg-surface-container-lowest dark:bg-dark-surface w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden border dark:border-dark-outline">
                        <div className="px-5 py-5 border-b border-outline-variant/50 dark:border-dark-outline flex flex-col gap-4 bg-surface-bright dark:bg-dark-surface-container">
                            <div className="flex justify-between items-center">
                                <h2 className="font-headline-sm font-black text-on-surface dark:text-white tracking-tighter text-lg uppercase">{selectedMonth.month_name}</h2>
                                <button onClick={() => setSelectedMonth(null)} className="text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-colors flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>
                            <div className="flex items-center justify-between bg-surface-container-lowest dark:bg-dark-background rounded-xl p-3 border border-error/20 dark:border-error/30 shadow-sm">
                                <div className="flex items-center gap-2.5 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-error/10 dark:bg-error/20 flex items-center justify-center text-error border border-error/20">
                                        <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-error font-black uppercase tracking-widest mb-0.5">Inversión Mensual</p>
                                        <p className="text-sm font-black text-error leading-none">${formatMoney(selectedMonth.total_usd)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-0 flex flex-col max-h-[50vh] overflow-y-auto bg-surface dark:bg-dark-surface">
                            {selectedMonth.restocks.map(r => (
                                <div key={r.id} className="p-4 border-b border-outline-variant/30 dark:border-dark-outline/30 flex flex-col gap-3">
                                    <div className="flex justify-between items-center text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                                        <span>Día: {formatTime(r.created_at)}</span>
                                        <span className="text-error">Gasto: ${formatMoney(r.total_usd)}</span>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        {r.items.map(item => (
                                            <div key={item.id} className="flex justify-between items-center text-xs font-bold text-on-surface dark:text-white bg-surface-container-lowest dark:bg-dark-background p-2 rounded-lg border border-outline-variant/20 dark:border-dark-outline/20">
                                                <span className="uppercase truncate w-[70%]">{item.product ? item.product.name : 'Eliminado'}</span>
                                                <span className="text-primary dark:text-dark-primary font-black">+{item.quantity} und</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* VIEJOS MODALES DE CREAR Y ELIMINAR */}
            {productToDelete && (
                <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in transition-all">
                    <div className="bg-surface-container-lowest dark:bg-dark-surface rounded-xl p-lg w-full max-w-sm shadow-2xl border dark:border-dark-outline">
                        <div className="flex items-center gap-3 mb-4 text-error">
                            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0 border border-error/20"><span className="material-symbols-outlined text-[24px]">warning_amber</span></div>
                            <h3 className="font-headline-sm font-bold text-on-surface dark:text-white uppercase tracking-tighter">Eliminar Producto</h3>
                        </div>
                        <p className="text-sm text-on-surface-variant dark:text-dark-on-surface-variant mb-6 leading-relaxed">¿Seguro que deseas eliminar <strong className="text-on-surface dark:text-white">"{productToDelete.name}"</strong>?</p>
                        <div className="flex justify-end gap-3 border-t border-outline-variant dark:border-dark-outline pt-4">
                            <button onClick={() => setProductToDelete(null)} className="px-4 py-2 text-on-surface-variant dark:text-dark-on-surface-variant font-black text-xs uppercase hover:bg-surface-container-high dark:hover:bg-dark-background rounded-lg transition-all border border-transparent dark:hover:border-dark-outline">Cancelar</button>
                            <button onClick={() => { router.delete(route('products.destroy', productToDelete.id), { onSuccess: () => { setProductToDelete(null); showToast('Eliminado!'); } }); }} className="px-5 py-2 bg-error text-onError hover:bg-error/90 font-black text-xs uppercase rounded-lg shadow-lg">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE EDICIÓN MASIVA */}
            {isBulkEditModalOpen && (
                <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in transition-all">
                    <div className="bg-surface-container-lowest dark:bg-dark-surface rounded-xl p-lg w-full max-w-md shadow-2xl border dark:border-dark-outline">
                        <div className="flex justify-between items-center mb-md border-b dark:border-dark-outline pb-4">
                            <h3 className="font-headline-md text-on-surface dark:text-dark-on-surface font-black uppercase text-sm tracking-widest">Edición Masiva</h3>
                            <button onClick={() => { setIsBulkEditModalOpen(false); setBulkPriceBs(''); setBulkPriceUsd(''); setBulkStock(''); }} className="text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-colors"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <p className="text-xs text-on-surface-variant mb-4">Modifica precio o stock global para <strong className="text-on-surface dark:text-white">{selectedIds.length} items</strong>.</p>
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="font-label-md text-on-surface-variant mb-1.5 block font-black text-[10px] uppercase tracking-widest">Nuevo Stock</label>
                                    <input type="text" inputMode="numeric" value={bulkStock} onChange={e => setBulkStock(sanitizeInteger(e.target.value))} className="w-full bg-surface-container dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-lg px-3 py-2 text-on-surface dark:text-white font-black text-sm focus:border-primary" placeholder="No cambiar" />
                                </div>
                                <div>
                                    <label className="font-label-md text-on-surface-variant mb-1.5 block font-black text-[10px] uppercase tracking-widest">Nuevo Costo ($)</label>
                                    <input type="text" inputMode="decimal" value={bulkCostUsd} onChange={e => setBulkCostUsd(sanitizeDecimal(e.target.value))} className="w-full bg-surface-container dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-lg px-3 py-2 text-on-surface dark:text-white font-black text-sm focus:border-primary" placeholder="0.00" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col justify-end">
                                    <label className="font-label-md text-on-surface-variant mb-1.5 block font-black text-[10px] uppercase tracking-widest">Nuevo Precio (Bs)</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={bulkPriceBs}
                                        onChange={e => {
                                            const val = sanitizeDecimal(e.target.value);
                                            setBulkPriceBs(val);
                                            setBulkPriceUsd(val ? (val / tasaBCV).toFixed(2) : '');
                                        }}
                                        className="w-full bg-surface-container dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-lg px-3 py-2 text-on-surface dark:text-white font-black text-sm focus:border-primary" placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="font-label-md text-primary dark:text-dark-primary mb-1.5 block font-black text-[10px] uppercase tracking-widest">Nuevo Precio ($)</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={bulkPriceUsd}
                                        onChange={e => {
                                            const val = sanitizeDecimal(e.target.value);
                                            setBulkPriceUsd(val);
                                            setBulkPriceBs(val ? (val * tasaBCV).toFixed(2) : '');
                                        }}
                                        className="w-full bg-primary/5 dark:bg-dark-primary/10 border border-primary/30 dark:border-dark-primary/30 rounded-lg px-3 py-2 text-primary dark:text-dark-primary font-black text-sm shadow-sm focus:border-primary" placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6 border-t border-outline-variant dark:border-dark-outline pt-4">
                            <button onClick={() => { setIsBulkEditModalOpen(false); setBulkPriceBs(''); setBulkPriceUsd(''); setBulkCostUsd(''); setBulkStock(''); }} className="px-4 py-2 text-on-surface-variant font-black text-xs uppercase hover:bg-surface-container-high rounded-lg transition-all">Cancelar</button>
                            <button onClick={handleBulkEdit} disabled={!bulkPriceBs && !bulkPriceUsd && !bulkCostUsd && !bulkStock} className="px-6 py-2 bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background font-black text-xs uppercase rounded-lg hover:opacity-90 disabled:opacity-50">Aplicar</button>
                        </div>
                    </div>
                </div>
            )}

            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in transition-all">
                    <div className="bg-surface-container-lowest dark:bg-dark-surface rounded-xl p-lg w-full max-w-md shadow-2xl border dark:border-dark-outline">
                        <div className="flex justify-between items-center mb-md border-b dark:border-dark-outline pb-4">
                            <h3 className="font-headline-md text-on-surface dark:text-dark-on-surface font-black uppercase text-sm tracking-widest">Nuevo Helado</h3>
                            <button onClick={() => { setIsCreateModalOpen(false); reset(); }} className="text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-colors"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <form onSubmit={submitCreate} className="flex flex-col gap-4 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-label-md text-on-surface-variant mb-1.5 block font-black text-[10px] uppercase tracking-widest">Sabor / Nombre</label>
                                    <input type="text" required value={data.name} onChange={e => setData('name', e.target.value)} className={`w-full bg-surface-container dark:bg-dark-background border rounded-lg px-3 py-2 text-on-surface dark:text-white transition-colors text-sm ${errors.name ? 'border-error' : 'border-outline-variant dark:border-dark-outline focus:border-primary'}`} />
                                </div>
                                <div>
                                    <label className="font-label-md text-on-surface-variant mb-1.5 block font-black text-[10px] uppercase tracking-widest">Categoría</label>
                                    <select value={data.category_id} onChange={e => setData('category_id', e.target.value)} className="w-full bg-surface-container dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-lg px-3 py-2 text-on-surface dark:text-white transition-colors text-sm focus:border-primary">
                                        {catsList.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="font-label-md text-on-surface-variant mb-1.5 block font-black text-[10px] uppercase tracking-widest">Stock</label>
                                    <input type="text" inputMode="numeric" required value={data.stock} onChange={e => setData('stock', sanitizeInteger(e.target.value))} className={`w-full bg-surface-container dark:bg-dark-background border rounded-lg px-3 py-2 text-on-surface dark:text-white text-sm transition-colors ${errors.stock ? 'border-error' : 'border-outline-variant dark:border-dark-outline focus:border-primary'}`} />
                                </div>
                                <div>
                                    <label className="font-label-md text-on-surface-variant mb-1.5 block font-black text-[10px] uppercase tracking-widest">Costo ($)</label>
                                    <input type="text" inputMode="decimal" value={data.cost_usd} onChange={e => setData('cost_usd', sanitizeDecimal(e.target.value))} placeholder="0.00" className="w-full bg-surface-container dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-lg px-3 py-2 text-on-surface dark:text-white text-sm transition-colors focus:border-primary" />
                                </div>
                                <div>
                                    <label className="font-label-md text-on-surface-variant mb-1.5 block font-black text-[10px] uppercase tracking-widest">Precio (Bs)</label>
                                    <input type="text" inputMode="decimal" required value={data.price_bs} onChange={e => { const val = sanitizeDecimal(e.target.value); setData({ ...data, price_bs: val, price_usd: val ? (val / tasaBCV).toFixed(2) : '' }); }} className={`w-full bg-surface-container dark:bg-dark-background border rounded-lg px-3 py-2 text-on-surface dark:text-white font-black text-sm transition-colors ${errors.price_bs ? 'border-error' : 'border-outline-variant dark:border-dark-outline focus:border-primary'}`} />
                                </div>
                                <div>
                                    <label className="font-label-md text-primary dark:text-dark-primary mb-1.5 block font-black text-[10px] uppercase tracking-widest">Precio ($)</label>
                                    <input type="text" inputMode="decimal" required value={data.price_usd} onChange={e => { const val = sanitizeDecimal(e.target.value); setData({ ...data, price_usd: val, price_bs: val ? (val * tasaBCV).toFixed(2) : '' }); }} className="w-full bg-primary/5 dark:bg-dark-primary/10 border border-primary/30 dark:border-dark-primary/30 rounded-lg px-3 py-2 text-primary font-black text-sm focus:border-primary" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-2 border-t border-outline-variant dark:border-dark-outline pt-4">
                                <button type="button" onClick={() => { setIsCreateModalOpen(false); reset(); }} className="px-4 py-2 text-on-surface-variant font-black text-xs uppercase hover:bg-surface-container-high rounded-lg transition-all">Cancelar</button>
                                <button type="submit" disabled={processing} className="px-6 py-2 bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background font-black text-xs uppercase rounded-lg hover:opacity-90 disabled:opacity-50">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PUNTO 4 CORREGIDO: MODAL DE EDICIÓN INDIVIDUAL */}
            {editingId && (() => {
                const product = products.find(p => p.id === editingId);
                if (!product) return null;
                const precioBs = (Number(product.price_usd) * tasaBCV).toFixed(2);

                return (
                    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in transition-all">
                        <div className="bg-surface-container-lowest dark:bg-dark-surface rounded-xl p-6 w-full max-w-sm shadow-2xl border dark:border-dark-outline">
                            <div className="flex justify-between items-center mb-4 border-b border-outline-variant/30 dark:border-dark-outline pb-3">
                                <h3 className="font-headline-md text-primary dark:text-dark-primary font-black uppercase text-sm tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">edit_square</span> Editar Producto
                                </h3>
                                <button onClick={() => setEditingId(null)} className="text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-4 mt-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                                    <div className="flex flex-col">
                                        <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1 whitespace-nowrap">Nombre</label>
                                        <input id={`edit_name_${product.id}`} className="font-headline-sm text-on-surface dark:text-white bg-surface-container dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-md px-3 py-2 w-full focus:border-primary dark:focus:border-dark-primary font-bold text-sm transition-colors" type="text" defaultValue={product.name} />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1 whitespace-nowrap">Categoría</label>
                                        <select id={`edit_category_${product.id}`} className="font-headline-sm text-on-surface dark:text-white bg-surface-container dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-md px-3 py-2 w-full focus:border-primary dark:focus:border-dark-primary font-bold text-sm transition-colors" defaultValue={product.category_id || 1}>
                                            {catsList.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                                    <div className="flex flex-col">
                                        <label className="text-[9px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest mb-1 whitespace-nowrap">Stock</label>
                                        <input id={`edit_stock_${product.id}`} type="text" inputMode="numeric" className="font-headline-sm text-on-surface dark:text-white bg-surface-container dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-md px-3 py-2 w-full font-bold text-sm" defaultValue={product.stock} onChange={e => e.target.value = sanitizeInteger(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[9px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest mb-1 whitespace-nowrap">Costo ($)</label>
                                        <input id={`edit_cost_usd_${product.id}`} type="text" inputMode="decimal" className="font-headline-sm text-on-surface dark:text-white bg-surface-container dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-md px-3 py-2 w-full font-bold text-sm" defaultValue={product.cost_usd || ''} onChange={e => e.target.value = sanitizeDecimal(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[9px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest mb-1 whitespace-nowrap">Precio Bs</label>
                                        <input id={`edit_price_bs_${product.id}`} type="text" inputMode="decimal" className="font-body-md text-on-surface dark:text-white bg-surface-container dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-md px-3 py-2 w-full font-bold text-sm" defaultValue={precioBs} onChange={(e) => {
                                            const val = sanitizeDecimal(e.target.value);
                                            e.target.value = val;
                                            document.getElementById(`edit_price_usd_${product.id}`).value = val ? (val / tasaBCV).toFixed(2) : '';
                                        }} />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[9px] font-black text-primary dark:text-dark-primary uppercase tracking-widest mb-1 whitespace-nowrap">Ref USD</label>
                                        <input id={`edit_price_usd_${product.id}`} type="text" inputMode="decimal" className="font-body-md text-primary dark:text-dark-primary bg-primary/5 dark:bg-dark-primary/10 border border-primary/30 dark:border-dark-primary/30 rounded-md px-3 py-2 w-full font-bold text-sm" defaultValue={product.price_usd} onChange={(e) => {
                                            const val = sanitizeDecimal(e.target.value);
                                            e.target.value = val;
                                            document.getElementById(`edit_price_bs_${product.id}`).value = val ? (val * tasaBCV).toFixed(2) : '';
                                        }} />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-2 border-t border-outline-variant/30 dark:border-dark-outline pt-4">
                                    <button onClick={() => setEditingId(null)} className="px-4 py-2 text-on-surface-variant font-black text-xs uppercase hover:bg-surface-container-high rounded-lg transition-all">Cancelar</button>
                                    <button onClick={() => {
                                        const newName = document.getElementById(`edit_name_${product.id}`).value;
                                        const newCategory = document.getElementById(`edit_category_${product.id}`).value;
                                        const newStock = document.getElementById(`edit_stock_${product.id}`).value;
                                        const newCostUsd = document.getElementById(`edit_cost_usd_${product.id}`).value;
                                        const newPriceBs = document.getElementById(`edit_price_bs_${product.id}`).value;
                                        const newPriceUsd = document.getElementById(`edit_price_usd_${product.id}`).value;
                                        router.put(route('products.update', product.id), { name: newName, stock: newStock, cost_usd: newCostUsd, price_bs: newPriceBs, price_usd: newPriceUsd, category_id: newCategory }, { onSuccess: () => { setEditingId(null); showToast('¡Producto actualizado!'); } });
                                    }} className="px-6 py-2 bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background font-black text-xs uppercase rounded-lg hover:opacity-90 shadow-md">Guardar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Modal de Categorías */}
            <CategoryManagerModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                categories={catsList}
            />

        </MainLayout>
    );
}