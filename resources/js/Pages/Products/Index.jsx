import { useState, useEffect } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

export default function Index({ auth, products, restockHistory = [] }) {
    const { tasa_bcv } = usePage().props;
    const tasaBCV = Number(tasa_bcv);
    const [editingId, setEditingId] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [toast, setToast] = useState('');

    // --- ESTADOS DE SELECCIÓN Y EDICIÓN MASIVA ---
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [bulkPriceBs, setBulkPriceBs] = useState('');
    const [bulkStock, setBulkStock] = useState('');

    // --- ESTADOS DE NUEVA REPOSICIÓN (CARRITO INVERTIDO) ---
    const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
    const [restockCart, setRestockCart] = useState([]);
    const [restockTotalUsd, setRestockTotalUsd] = useState('');
    const [restockTotalBs, setRestockTotalBs] = useState('');

    // --- ESTADOS DE HISTÓRICO DE REPOSICIONES ---
    const [isRestockHistorySidebarOpen, setIsRestockHistorySidebarOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(null);

    // --- BÚSQUEDA Y ORDENAMIENTO ---
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState(() => localStorage.getItem('ik_inventory_sort') || 'name_asc');

    useEffect(() => localStorage.setItem('ik_inventory_sort', sortBy), [sortBy]);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(''), 3000);
    };

    const sanitizeDecimal = (val) => {
        let v = String(val).replace(',', '.').replace(/[^0-9.]/g, '');
        const p = v.split('.');
        if (p.length > 2) v = p[0] + '.' + p.slice(1).join('').replace(/\./g, '');
        return v;
    };

    const sanitizeInteger = (val) => String(val).replace(/\D/g, '');

    // --- CREAR NUEVO PRODUCTO ---
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '', stock: '', price_bs: '', price_usd: '', category_id: 1,
    });

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('products.store'), {
            onSuccess: () => { setIsCreateModalOpen(false); reset(); showToast('¡Producto registrado!'); }
        });
    };

    // --- LÓGICA DE REPOSICIÓN (CARRITO INVERTIDO TIPO POS) ---
    const addToRestock = (product) => {
        setRestockCart(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { product, quantity: 1 }];
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

    const removeFromRestock = (id) => setRestockCart(prev => prev.filter(i => i.product.id !== id));

    const clearRestockCart = () => {
        setRestockCart([]);
        setRestockTotalUsd('');
        setRestockTotalBs('');
    };

    const submitRestock = () => {
        router.post(route('products.restock'), {
            total_usd: restockTotalUsd || 0,
            total_bs: restockTotalBs || 0,
            items: restockCart.map(i => ({ product_id: i.product.id, quantity: i.quantity }))
        }, {
            onSuccess: () => {
                setIsRestockModalOpen(false);
                clearRestockCart();
                showToast('¡Inventario repuesto con éxito!');
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
            price_usd: bulkPriceBs !== '' ? (bulkPriceBs / tasaBCV).toFixed(2) : null,
            stock: bulkStock !== '' ? bulkStock : null
        }, {
            onSuccess: () => { setSelectedIds([]); setBulkPriceBs(''); setBulkStock(''); setIsBulkEditModalOpen(false); showToast('Actualizado masivamente!'); }
        });
    };

    const handleBulkDelete = () => {
        router.post(route('products.bulkDestroy'), { ids: selectedIds }, {
            onSuccess: () => { setSelectedIds([]); setIsBulkDeleteModalOpen(false); showToast('Productos eliminados!'); }
        });
    };

    // --- ORDENAMIENTO Y FILTRADO ---
    let productosProcesados = [...products];
    if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        productosProcesados = productosProcesados.filter(p => p.name.toLowerCase().includes(query));
    }
    productosProcesados.sort((a, b) => {
        const sA = Number(a.stock), sB = Number(b.stock);
        if (sA <= 0 && sB > 0) return 1;
        if (sA > 0 && sB <= 0) return -1;
        if (sA <= 0 && sB <= 0) return a.name.localeCompare(b.name);
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'price_desc') return Number(b.price_usd) - Number(a.price_usd);
        if (sortBy === 'price_asc') return Number(a.price_usd) - Number(b.price_usd);
        if (sortBy === 'stock_desc') return sB - sA;
        if (sortBy === 'stock_asc') return sA - sB;
        return 0;
    });

    const formatTime = (dateString) => new Date(dateString).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
    const formatMoney = (val) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(val);

    return (
        <MainLayout>
            <div className="bg-background dark:bg-dark-background text-on-background dark:text-dark-on-surface font-body-md min-h-screen flex flex-col pb-[120px] md:pb-24 transition-colors">
                <Head title="Inventario" />

                <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-margin-desktop py-6 md:py-8 relative">

                    {/* ENCABEZADO Y BOTONES DE ACCIÓN MEJORADOS */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 w-full border-b border-outline-variant/30 dark:border-dark-outline pb-6">
                        <div>
                            <h2 className="font-headline-lg text-headline-lg text-on-surface dark:text-white mb-1 font-bold tracking-tight">Gestión de Inventario</h2>
                            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">Controla tu stock y registra compras.</p>
                        </div>

                        <div className="flex flex-row items-center justify-between md:justify-end gap-2 w-full md:w-auto overflow-x-auto hide-scrollbar">
                            <button onClick={() => setIsRestockHistorySidebarOpen(true)} className="flex items-center gap-1.5 px-3 h-[36px] rounded-lg border border-outline-variant dark:border-dark-outline text-on-surface-variant dark:text-dark-on-surface-variant font-black text-[10px] sm:text-xs uppercase tracking-wider hover:bg-surface-container-high dark:hover:bg-dark-surface-container transition-colors shrink-0 bg-surface dark:bg-dark-surface">
                                <span className="material-symbols-outlined text-[16px]">history</span>
                                Histórico
                            </button>
                            <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-1.5 px-3 h-[36px] rounded-lg border border-outline-variant dark:border-dark-outline text-on-surface-variant dark:text-dark-on-surface-variant font-black text-[10px] sm:text-xs uppercase tracking-wider hover:bg-surface-container-high dark:hover:bg-dark-surface-container transition-colors shrink-0 bg-surface dark:bg-dark-surface">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Producto
                            </button>
                            <button onClick={() => setIsRestockModalOpen(true)} className="flex items-center gap-1.5 px-4 h-[36px] bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background hover:opacity-90 transition-all rounded-lg shadow-sm font-black text-[10px] sm:text-xs uppercase tracking-wider shrink-0 border dark:border-dark-primary/20">
                                <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                                Reposición
                            </button>
                        </div>
                    </div>

                    {/* FILTROS MINIMALISTAS CORREGIDOS */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 w-full px-1">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {productosProcesados.length > 0 && (
                                <button onClick={toggleAll} className="text-[10px] sm:text-xs font-black uppercase text-on-surface-variant dark:text-dark-on-surface-variant hover:text-primary dark:hover:text-dark-primary transition-colors flex items-center gap-1">
                                    <span className={`material-symbols-outlined text-[18px] ${selectedIds.length > 0 ? 'text-primary' : ''}`}>{selectedIds.length > 0 ? 'check_box' : 'check_box_outline_blank'}</span>
                                    {selectedIds.length > 0 ? 'Deseleccionar' : 'Seleccionar Todo'}
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                            <div className="relative w-full sm:w-64 h-8 border-b border-outline-variant/60 dark:border-dark-outline focus-within:border-primary dark:focus-within:border-dark-primary transition-colors">
                                <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-dark-on-surface-variant text-[18px]">search</span>
                                <input
                                    type="text"
                                    placeholder="Buscar helado..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-full pl-7 pr-4 bg-transparent border-none text-sm font-medium text-on-surface dark:text-white focus:ring-0 placeholder:text-on-surface-variant/50 px-0 outline-none"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error transition-colors flex items-center">
                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                    </button>
                                )}
                            </div>

                            {/* SELECTOR NATIVO LIMPIO */}
                            <div className="flex items-center gap-1 w-full sm:w-auto h-8 border-b border-outline-variant/60 dark:border-dark-outline focus-within:border-primary dark:focus-within:border-dark-primary transition-colors">
                                <span className="material-symbols-outlined text-on-surface-variant dark:text-dark-on-surface-variant text-[18px] pointer-events-none shrink-0">sort</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full sm:w-auto bg-transparent border-none text-on-surface dark:text-white text-[11px] font-bold uppercase tracking-widest focus:ring-0 cursor-pointer outline-none pl-1 py-1"
                                >
                                    <option value="name_asc">Alfabético</option>
                                    <option value="price_desc">Mayor Precio</option>
                                    <option value="price_asc">Menor Precio</option>
                                    <option value="stock_desc">Mayor Stock</option>
                                    <option value="stock_asc">Menor Stock</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* GRILLA DE PRODUCTOS */}
                    {productosProcesados.length === 0 ? (
                        <div className="text-center p-12 mt-4 border border-dashed border-outline-variant dark:border-dark-outline rounded-2xl bg-surface-container-lowest dark:bg-dark-background/40">
                            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/50 dark:text-dark-on-surface-variant/50 mb-4 block">inventory_2</span>
                            <p className="text-on-surface-variant dark:text-dark-on-surface-variant font-bold text-lg">No se encontraron productos.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                            {productosProcesados.map(product => {
                                const isEditing = editingId === product.id;
                                const isLowStock = Number(product.stock) <= 1;
                                const isSelected = selectedIds.includes(product.id);
                                const precioUSD = Number(product.price_usd).toFixed(2);
                                const precioBs = (Number(product.price_usd) * tasaBCV).toFixed(2);

                                if (isEditing) {
                                    return (
                                        <div key={product.id} className="bg-surface-container-lowest dark:bg-dark-surface border-2 border-primary dark:border-dark-primary rounded-xl p-4 shadow-xl relative overflow-hidden transition-all col-span-2 md:col-span-4 lg:col-span-5">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary dark:bg-dark-primary"></div>
                                            <div className="flex flex-col gap-4 pl-2">
                                                <div className="flex flex-col">
                                                    <label className="text-[9px] font-black text-primary dark:text-dark-primary uppercase tracking-[0.2em] mb-1 whitespace-nowrap">Nombre</label>
                                                    <input id={`edit_name_${product.id}`} className="font-headline-sm text-on-surface dark:text-white bg-surface-container-lowest dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-md px-3 py-2 w-full focus:border-primary dark:focus:border-dark-primary font-bold text-sm transition-colors" type="text" defaultValue={product.name} />
                                                </div>
                                                <div className="grid grid-cols-3 gap-3 w-full">
                                                    <div className="flex flex-col">
                                                        <label className="text-[9px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest mb-1 whitespace-nowrap">Stock actual</label>
                                                        <input id={`edit_stock_${product.id}`} type="text" inputMode="numeric" className="font-headline-sm text-on-surface dark:text-white bg-surface-container-lowest dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-md px-2 md:px-3 py-2 w-full font-bold text-sm" defaultValue={product.stock} onChange={e => e.target.value = sanitizeInteger(e.target.value)} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <label className="text-[9px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest mb-1 whitespace-nowrap">Precio Bs</label>
                                                        <input id={`edit_price_bs_${product.id}`} type="text" inputMode="decimal" className="font-body-md text-on-surface dark:text-white bg-surface-container-lowest dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-md px-2 md:px-3 py-2 w-full font-bold text-sm" defaultValue={precioBs} onChange={(e) => {
                                                            const val = sanitizeDecimal(e.target.value);
                                                            e.target.value = val;
                                                            document.getElementById(`edit_price_usd_${product.id}`).value = val ? (val / tasaBCV).toFixed(2) : '';
                                                        }} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <label className="text-[9px] font-black text-primary dark:text-dark-primary uppercase tracking-widest mb-1 whitespace-nowrap">Ref USD</label>
                                                        <input id={`edit_price_usd_${product.id}`} type="text" inputMode="decimal" className="font-body-md text-primary dark:text-dark-primary bg-primary-container/10 dark:bg-dark-primary/10 border border-primary/50 dark:border-dark-primary/30 rounded-md px-2 md:px-3 py-2 w-full font-bold text-sm" defaultValue={product.price_usd} onChange={(e) => {
                                                            const val = sanitizeDecimal(e.target.value);
                                                            e.target.value = val;
                                                            document.getElementById(`edit_price_bs_${product.id}`).value = val ? (val * tasaBCV).toFixed(2) : '';
                                                        }} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-end w-full gap-3 border-t border-outline-variant dark:border-dark-outline pt-3 mt-1">
                                                    <button onClick={() => setEditingId(null)} className="text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error dark:hover:text-error px-4 py-2 rounded-lg text-xs font-black uppercase transition-colors border border-transparent dark:hover:border-dark-outline">Cancelar</button>
                                                    <button onClick={() => {
                                                        const newName = document.getElementById(`edit_name_${product.id}`).value;
                                                        const newStock = document.getElementById(`edit_stock_${product.id}`).value;
                                                        const newPriceBs = document.getElementById(`edit_price_bs_${product.id}`).value;
                                                        const newPriceUsd = document.getElementById(`edit_price_usd_${product.id}`).value;
                                                        router.put(route('products.update', product.id), { name: newName, stock: newStock, price_bs: newPriceBs, price_usd: newPriceUsd, category_id: 1 }, { onSuccess: () => { setEditingId(null); showToast('¡Producto actualizado!'); } });
                                                    }} className="bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background px-6 py-2 rounded-lg text-xs font-black uppercase transition-all shadow-md">Guardar</button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={product.id} className={`bg-surface dark:bg-dark-surface border rounded-xl p-3 md:p-4 flex flex-col relative shadow-sm hover:shadow-md select-none ${isSelected ? 'border-primary ring-1 ring-primary dark:border-dark-primary dark:ring-dark-primary' : 'border-outline-variant dark:border-dark-outline'}`}>
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${isLowStock ? 'bg-error' : isSelected ? 'bg-primary dark:bg-dark-primary' : 'bg-transparent'}`}></div>
                                        <div className="w-full aspect-square rounded-lg bg-blue-50 dark:bg-dark-background mb-3 overflow-hidden relative transition-colors border dark:border-dark-outline/50 group">
                                            <div className="w-full h-full flex items-center justify-center text-blue-400 dark:text-blue-500">
                                                <span className="material-symbols-outlined opacity-80 text-[48px]">icecream</span>
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
                                            <h3 className="font-headline-sm text-body-md font-bold leading-tight line-clamp-2 mb-2 text-gray-800 dark:text-dark-on-surface uppercase tracking-tight text-xs">
                                                {product.name}
                                            </h3>
                                            <div className="flex items-center gap-1 mb-2">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${isLowStock ? 'text-error' : 'text-on-surface-variant dark:text-dark-on-surface-variant'}`}>Stock:</span>
                                                <span className={`text-sm font-bold leading-none ${isLowStock ? 'text-error' : 'text-on-surface dark:text-white'}`}>{product.stock}</span>
                                            </div>
                                            <div className="flex flex-col mt-auto border-t border-outline-variant/30 dark:border-dark-outline pt-2">
                                                <p className="font-label-md text-primary dark:text-dark-primary font-black tracking-tighter text-sm">${precioUSD}</p>
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

            {/* MODAL: CARRITO INVERTIDO PARA REPOSICIÓN REDISEÑADO */}
            {isRestockModalOpen && (
                <div className="fixed inset-0 bg-black/90 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-fade-in transition-all">
                    <div className="bg-surface-container-lowest dark:bg-dark-surface rounded-t-2xl md:rounded-xl w-full max-w-4xl h-[95vh] md:max-h-[85vh] shadow-2xl border dark:border-dark-outline flex flex-col overflow-hidden">

                        {/* Cabecera del Modal */}
                        <div className="px-5 py-4 border-b border-outline-variant/50 dark:border-dark-outline flex justify-between items-center bg-surface-bright dark:bg-dark-surface-container shrink-0">
                            <div>
                                <h3 className="font-headline-md text-on-surface dark:text-dark-on-surface font-black uppercase text-sm tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary dark:text-dark-primary">inventory_2</span>
                                    Registrar Compra
                                </h3>
                            </div>
                            <div className="flex items-center gap-3">
                                {restockCart.length > 0 && (
                                    <button onClick={clearRestockCart} className="text-[10px] font-black uppercase tracking-widest text-error hover:text-error/80 transition-colors flex items-center gap-1 bg-error/10 px-2 py-1 rounded">
                                        <span className="material-symbols-outlined text-[14px]">delete_sweep</span> Vaciar
                                    </button>
                                )}
                                <button onClick={() => { setIsRestockModalOpen(false); clearRestockCart(); }} className="text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Contenido dividido */}
                        <div className="flex flex-col md:flex-row flex-grow overflow-hidden">

                            {/* Lado Izquierdo: Catálogo y Carrito */}
                            <div className="w-full md:w-3/5 border-b md:border-b-0 md:border-r border-outline-variant/30 dark:border-dark-outline flex flex-col overflow-hidden h-[60vh] md:h-full">

                                {/* Lista de Productos */}
                                <div className="p-3 border-b border-outline-variant/30 dark:border-dark-outline bg-surface-container-lowest dark:bg-dark-background/50 h-[30vh] md:h-[40vh] overflow-y-auto shrink-0 relative">
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                        {products.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => addToRestock(p)}
                                                className="text-left px-3 py-2 bg-surface-container dark:bg-dark-surface border border-outline-variant/50 dark:border-dark-outline rounded-lg hover:border-primary dark:hover:border-dark-primary transition-colors flex flex-col items-start gap-1"
                                            >
                                                <span className="text-[11px] font-bold uppercase text-on-surface dark:text-white truncate w-full">{p.name}</span>
                                                <span className="text-[9px] opacity-70 text-on-surface-variant dark:text-dark-on-surface-variant">Stock: {p.stock}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Carrito Invertido (Sin icono) */}
                                <div className="flex-grow overflow-y-auto p-3 flex flex-col gap-2 bg-surface-container-lowest/50 dark:bg-dark-background/20 relative">
                                    {restockCart.length === 0 ? (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-40">
                                            <p className="text-xs font-bold uppercase tracking-widest">Aún no has agregado helados</p>
                                        </div>
                                    ) : (
                                        restockCart.map(item => (
                                            <div key={item.product.id} className="flex justify-between items-center p-2 rounded-lg border border-outline-variant/50 dark:border-dark-outline bg-surface dark:bg-dark-surface shadow-sm">
                                                <div className="flex-grow min-w-0 pr-2">
                                                    <p className="text-[11px] sm:text-xs font-bold uppercase text-on-surface dark:text-white truncate">{item.product.name}</p>
                                                </div>

                                                {/* Controles POS */}
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button onClick={() => updateRestockQty(item.product.id, item.quantity - 1)} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-surface-container-high dark:bg-dark-background text-on-surface dark:text-white rounded hover:text-primary transition-colors border dark:border-dark-outline">
                                                        <span className="material-symbols-outlined text-[16px]">remove</span>
                                                    </button>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={item.quantity}
                                                        onChange={(e) => updateRestockQty(item.product.id, sanitizeInteger(e.target.value))}
                                                        className="w-10 sm:w-12 h-8 text-center font-black text-sm bg-transparent border-none focus:ring-0 px-0 text-on-surface dark:text-white"
                                                    />
                                                    <button onClick={() => updateRestockQty(item.product.id, item.quantity + 1)} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-surface-container-high dark:bg-dark-background text-on-surface dark:text-white rounded hover:text-primary transition-colors border dark:border-dark-outline">
                                                        <span className="material-symbols-outlined text-[16px]">add</span>
                                                    </button>
                                                    <div className="w-px h-6 bg-outline-variant/50 mx-1"></div>
                                                    <button onClick={() => removeFromRestock(item.product.id)} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-error bg-error/10 hover:bg-error border border-error/20 hover:text-white rounded transition-colors">
                                                        <span className="material-symbols-outlined text-[14px] sm:text-[16px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Lado Derecho: Gasto Total y Resumen */}
                            <div className="w-full md:w-2/5 p-5 flex flex-col bg-surface-container-low dark:bg-dark-background/80 shrink-0 h-[35vh] md:h-auto overflow-y-auto">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant mb-4">Inversión de Reposición</h4>
                                <div className="flex flex-col gap-4 mb-4">
                                    <div>
                                        <label className="text-[10px] font-black text-primary dark:text-dark-primary uppercase tracking-widest mb-1.5 block">Total Gastado (Divisas / Efectivo USD)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-primary">$</span>
                                            <input
                                                type="text" inputMode="decimal" placeholder="0.00"
                                                value={restockTotalUsd}
                                                onChange={e => {
                                                    const v = sanitizeDecimal(e.target.value);
                                                    setRestockTotalUsd(v); setRestockTotalBs(v ? (v * tasaBCV).toFixed(2) : '');
                                                }}
                                                className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-primary/30 dark:border-dark-primary/30 bg-primary/5 dark:bg-dark-primary/10 text-primary dark:text-dark-primary font-black text-lg focus:border-primary focus:ring-0"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5 block">Total Gastado (Bs / Pago Móvil)</label>
                                        <div className="relative">
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-on-surface-variant opacity-50 text-sm">Bs</span>
                                            <input
                                                type="text" inputMode="decimal" placeholder="0.00"
                                                value={restockTotalBs}
                                                onChange={e => {
                                                    const v = sanitizeDecimal(e.target.value);
                                                    setRestockTotalBs(v); setRestockTotalUsd(v ? (v / tasaBCV).toFixed(2) : '');
                                                }}
                                                className="w-full pl-3 pr-8 py-2.5 rounded-lg border border-outline-variant dark:border-dark-outline bg-surface dark:bg-dark-surface text-on-surface dark:text-white font-black text-lg focus:border-primary focus:ring-0"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 border-t border-outline-variant/30 dark:border-dark-outline">
                                    <button
                                        onClick={submitRestock}
                                        disabled={restockCart.length === 0 || (!restockTotalUsd && !restockTotalBs)}
                                        className="w-full py-3 bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background font-black text-sm uppercase rounded-lg shadow-md hover:opacity-90 disabled:opacity-50 transition-all border dark:border-dark-primary/20 flex justify-center items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">save</span>
                                        Guardar Factura
                                    </button>
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

            {isBulkDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in transition-all">
                    <div className="bg-surface-container-lowest dark:bg-dark-surface rounded-xl p-lg w-full max-w-sm shadow-2xl border dark:border-dark-outline">
                        <div className="flex items-center gap-3 mb-4 text-error">
                            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0 border border-error/20"><span className="material-symbols-outlined text-[24px]">warning_amber</span></div>
                            <h3 className="font-headline-sm font-bold text-on-surface dark:text-white uppercase tracking-tighter">Eliminación Masiva</h3>
                        </div>
                        <p className="text-sm text-on-surface-variant dark:text-dark-on-surface-variant mb-6 leading-relaxed">Eliminarás <strong className="text-on-surface dark:text-white">{selectedIds.length} productos</strong> al mismo tiempo.</p>
                        <div className="flex justify-end gap-3 border-t border-outline-variant dark:border-dark-outline pt-4">
                            <button onClick={() => setIsBulkDeleteModalOpen(false)} className="px-4 py-2 text-on-surface-variant dark:text-dark-on-surface-variant font-black text-xs uppercase hover:bg-surface-container-high dark:hover:bg-dark-background rounded-lg transition-all border border-transparent dark:hover:border-dark-outline">Cancelar</button>
                            <button onClick={handleBulkDelete} className="px-5 py-2 bg-error text-onError hover:bg-error/90 font-black text-xs uppercase rounded-lg shadow-lg">Sí, Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            {isBulkEditModalOpen && (
                <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in transition-all">
                    <div className="bg-surface-container-lowest dark:bg-dark-surface rounded-xl p-lg w-full max-w-md shadow-2xl border dark:border-dark-outline">
                        <div className="flex justify-between items-center mb-md border-b dark:border-dark-outline pb-4">
                            <h3 className="font-headline-md text-on-surface dark:text-dark-on-surface font-black uppercase text-sm tracking-widest">Edición Masiva</h3>
                            <button onClick={() => { setIsBulkEditModalOpen(false); setBulkPriceBs(''); setBulkStock(''); }} className="text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-colors"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <p className="text-xs text-on-surface-variant mb-4">Modifica precio o stock global para <strong className="text-on-surface dark:text-white">{selectedIds.length} items</strong>.</p>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="font-label-md text-on-surface-variant mb-1.5 block font-black text-[10px] uppercase tracking-widest">Nuevo Stock</label>
                                <input type="text" inputMode="numeric" value={bulkStock} onChange={e => setBulkStock(sanitizeInteger(e.target.value))} className="w-full bg-surface-container dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-lg px-3 py-2 text-on-surface dark:text-white font-black text-sm focus:border-primary" placeholder="En blanco = No cambiar" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col justify-end">
                                    <label className="font-label-md text-on-surface-variant mb-1.5 block font-black text-[10px] uppercase tracking-widest">Nuevo Precio (Bs)</label>
                                    <input type="text" inputMode="decimal" value={bulkPriceBs} onChange={e => setBulkPriceBs(sanitizeDecimal(e.target.value))} className="w-full bg-surface-container dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-lg px-3 py-2 text-on-surface dark:text-white font-black text-sm focus:border-primary" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="font-label-md text-primary dark:text-dark-primary mb-1.5 block font-black text-[10px] uppercase tracking-widest">Equivalente ($)</label>
                                    <input type="text" inputMode="decimal" value={bulkPriceBs ? (bulkPriceBs / tasaBCV).toFixed(2) : ''} onChange={e => setBulkPriceBs(e.target.value ? (sanitizeDecimal(e.target.value) * tasaBCV).toFixed(2) : '')} className="w-full bg-primary/5 dark:bg-dark-primary/10 border border-primary/30 dark:border-dark-primary/30 rounded-lg px-3 py-2 text-primary dark:text-dark-primary font-black text-sm shadow-sm focus:border-primary" placeholder="0.00" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6 border-t border-outline-variant dark:border-dark-outline pt-4">
                            <button onClick={() => { setIsBulkEditModalOpen(false); setBulkPriceBs(''); setBulkStock(''); }} className="px-4 py-2 text-on-surface-variant font-black text-xs uppercase hover:bg-surface-container-high rounded-lg transition-all">Cancelar</button>
                            <button onClick={handleBulkEdit} disabled={!bulkPriceBs && !bulkStock} className="px-6 py-2 bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background font-black text-xs uppercase rounded-lg hover:opacity-90 disabled:opacity-50">Aplicar</button>
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
                            <div>
                                <label className="font-label-md text-on-surface-variant mb-1.5 block font-black text-[10px] uppercase tracking-widest">Sabor / Nombre</label>
                                <input type="text" required value={data.name} onChange={e => setData('name', e.target.value)} className={`w-full bg-surface-container dark:bg-dark-background border rounded-lg px-3 py-2 text-on-surface dark:text-white transition-colors text-sm ${errors.name ? 'border-error' : 'border-outline-variant dark:border-dark-outline focus:border-primary'}`} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="font-label-md text-on-surface-variant mb-1.5 block font-black text-[10px] uppercase tracking-widest">Stock</label>
                                    <input type="text" inputMode="numeric" required value={data.stock} onChange={e => setData('stock', sanitizeInteger(e.target.value))} className={`w-full bg-surface-container dark:bg-dark-background border rounded-lg px-3 py-2 text-on-surface dark:text-white text-sm transition-colors ${errors.stock ? 'border-error' : 'border-outline-variant dark:border-dark-outline focus:border-primary'}`} />
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

            {toast && (
                <div className="fixed top-24 right-4 bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background px-6 py-3 rounded-lg shadow-2xl z-[200] font-black animate-fade-in flex items-center gap-2 border dark:border-dark-primary/30">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span className="text-xs uppercase tracking-widest">{toast}</span>
                </div>
            )}
        </MainLayout>
    );
}