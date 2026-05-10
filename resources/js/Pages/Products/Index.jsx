import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

export default function Index({ auth, products }) {
    const tasaBCV = 500.46;
    const [editingId, setEditingId] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [toast, setToast] = useState('');

    // --- NUEVOS ESTADOS PARA ACCIONES MASIVAS ---
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [bulkPriceBs, setBulkPriceBs] = useState('');
    const [bulkStock, setBulkStock] = useState('');

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(''), 3000);
    };

    const getStockPercentage = (stock) => Math.min((stock / 100) * 100, 100);

    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        stock: 0,
        price: 0,
        category_id: 1,
    });

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('products.store'), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
                showToast('¡Producto registrado con éxito!');
            }
        });
    };

    // --- FUNCIONES MASIVAS ---
    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedIds.length > 0) {
            setSelectedIds([]); // Si hay 1 o más, limpiar todo
        } else {
            setSelectedIds(products.map(p => p.id)); // Si no hay nada, seleccionar todo
        }
    };

    const handleBulkDelete = () => {
        router.post(route('products.bulkDestroy'), { ids: selectedIds }, {
            onSuccess: () => {
                setSelectedIds([]);
                setIsBulkDeleteModalOpen(false);
                showToast('¡Productos eliminados masivamente!');
            }
        });
    };

    const handleBulkEdit = () => {
        router.post(route('products.bulkUpdate'), {
            ids: selectedIds,
            price: bulkPriceBs !== '' ? bulkPriceBs : null,
            stock: bulkStock !== '' ? bulkStock : null
        }, {
            onSuccess: () => {
                setSelectedIds([]);
                setBulkPriceBs('');
                setBulkStock('');
                setIsBulkEditModalOpen(false);
                showToast('¡Items actualizados masivamente!');
            }
        });
    };

    return (
        <MainLayout>
            <div className="bg-background dark:bg-dark-background text-on-background dark:text-dark-on-surface font-body-md min-h-screen flex flex-col pb-[120px] md:pb-24 transition-colors">
                <Head title="Inventario" />

                <main className="flex-grow w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-md md:py-xl relative">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-lg gap-sm md:gap-0">
                        <div>
                            <h2 className="font-headline-lg text-headline-lg text-on-surface dark:text-white mb-xs font-bold transition-colors tracking-tight">Gestión de Inventario</h2>
                            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">Administra niveles de stock, categorías y precios.</p>
                        </div>
                        <div className="flex items-center gap-sm w-full md:w-auto mt-sm md:mt-0">
                            {/* Botón Seleccionar Todos (Opcional, muy útil) */}
                            {products.length > 0 && (
                                <button onClick={toggleAll} className="text-xs font-black uppercase text-on-surface-variant dark:text-dark-on-surface-variant hover:text-primary dark:hover:text-dark-primary transition-colors px-3">
                                    {selectedIds.length > 0 ? 'Deseleccionar Todos' : 'Seleccionar Todo'}
                                </button>
                            )}
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background hover:opacity-90 transition-all px-6 py-2 rounded-lg shadow-md flex items-center gap-2 font-body-md text-body-md font-black ml-auto md:ml-0 border dark:border-dark-primary/20"
                            >
                                <span className="material-symbols-outlined text-[18px]">add_box</span>
                                <span className="hidden md:inline">NUEVO PRODUCTO</span>
                                <span className="md:hidden">NUEVO</span>
                            </button>
                        </div>
                    </div>

                    {/* Lista de Productos */}
                    <div className="flex flex-col gap-sm">
                        {products.length === 0 ? (
                            <div className="text-center p-8 bg-surface-container-lowest dark:bg-dark-surface rounded-xl border border-outline-variant dark:border-dark-outline text-on-surface-variant dark:text-dark-on-surface-variant italic">
                                No hay productos registrados.
                            </div>
                        ) : (
                            products.map(product => {
                                const isEditing = editingId === product.id;
                                const isLowStock = product.stock <= 5;
                                const isSelected = selectedIds.includes(product.id);
                                const precioUSD = (product.price / tasaBCV).toFixed(2);
                                const precioBs = Number(product.price).toFixed(2);

                                // ==========================================
                                // MODO EDICIÓN INDIVIDUAL
                                // ==========================================
                                if (isEditing) {
                                    return (
                                        <div key={product.id} className="bg-surface-container-lowest dark:bg-dark-surface border-2 border-primary dark:border-dark-primary rounded-xl p-4 shadow-xl relative overflow-hidden transition-all">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary dark:bg-dark-primary"></div>

                                            <div className="flex flex-col gap-4 pl-2">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                                                    <div className="flex flex-col">
                                                        <label className="text-[9px] font-black text-primary dark:text-dark-primary uppercase tracking-[0.2em] mb-1 whitespace-nowrap">Nombre</label>
                                                        <input id={`edit_name_${product.id}`} className="font-headline-sm text-on-surface dark:text-white bg-surface-container-lowest dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-md px-3 py-2 w-full focus:border-primary dark:focus:border-dark-primary font-bold text-sm transition-colors" type="text" defaultValue={product.name} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <label className="text-[9px] font-black text-primary dark:text-dark-primary uppercase tracking-[0.2em] mb-1 whitespace-nowrap">Categoría</label>
                                                        <select id={`edit_category_${product.id}`} className="font-label-md text-on-surface dark:text-dark-on-surface bg-surface-container-lowest dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-md px-3 py-2 focus:border-primary dark:focus:border-dark-primary w-full text-sm" defaultValue={product.category_id}>
                                                            <option value="1">Tetas</option>
                                                            <option value="2">Helados</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3 w-full">
                                                    <div className="flex flex-col">
                                                        <label className="text-[9px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest mb-1 whitespace-nowrap">Stock</label>
                                                        <input id={`edit_stock_${product.id}`} className="font-headline-sm text-on-surface dark:text-white bg-surface-container-lowest dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-md px-2 md:px-3 py-2 w-full font-bold text-sm" type="number" defaultValue={product.stock} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <label className="text-[9px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest mb-1 whitespace-nowrap">Precio Bs</label>
                                                        <input id={`edit_price_bs_${product.id}`} className="font-body-md text-on-surface dark:text-white bg-surface-container-lowest dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-md px-2 md:px-3 py-2 w-full font-bold text-sm" step="0.01" type="number" defaultValue={product.price} onChange={(e) => { document.getElementById(`edit_price_usd_${product.id}`).value = (e.target.value / tasaBCV).toFixed(2); }} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <label className="text-[9px] font-black text-primary dark:text-dark-primary uppercase tracking-widest mb-1 whitespace-nowrap">Ref USD</label>
                                                        <input id={`edit_price_usd_${product.id}`} className="font-body-md text-primary dark:text-dark-primary bg-primary-container/10 dark:bg-dark-primary/10 border border-primary/50 dark:border-dark-primary/30 rounded-md px-2 md:px-3 py-2 w-full font-bold text-sm" step="0.01" type="number" defaultValue={(product.price / tasaBCV).toFixed(2)} onChange={(e) => { document.getElementById(`edit_price_bs_${product.id}`).value = (e.target.value * tasaBCV).toFixed(2); }} />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-end w-full gap-3 border-t border-outline-variant dark:border-dark-outline pt-3 mt-1">
                                                    <button onClick={() => setEditingId(null)} className="text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error dark:hover:text-error px-4 py-2 rounded-lg text-xs font-black uppercase transition-colors border border-transparent dark:hover:border-dark-outline">Cancelar</button>
                                                    <button onClick={() => {
                                                        const newName = document.getElementById(`edit_name_${product.id}`).value;
                                                        const newStock = document.getElementById(`edit_stock_${product.id}`).value;
                                                        const newPriceBs = document.getElementById(`edit_price_bs_${product.id}`).value;
                                                        const newCategory = document.getElementById(`edit_category_${product.id}`).value;
                                                        router.put(route('products.update', product.id), { name: newName, stock: newStock, price: newPriceBs, category_id: newCategory }, { onSuccess: () => { setEditingId(null); showToast('¡Producto actualizado correctamente!'); } });
                                                    }} className="bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background px-6 py-2 rounded-lg text-xs font-black uppercase transition-all shadow-md">Guardar</button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                // ==========================================
                                // MODO LECTURA NORMAL (Con Checkbox)
                                // ==========================================
                                return (
                                    <div key={product.id} className={`bg-surface-container-lowest dark:bg-dark-surface border rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${isSelected ? 'border-primary dark:border-dark-primary ring-1 ring-primary dark:ring-dark-primary' : 'border-outline-variant dark:border-dark-outline'}`}>
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isLowStock ? 'bg-error' : isSelected ? 'bg-primary dark:bg-dark-primary' : 'bg-primary dark:bg-dark-primary/40'}`}></div>

                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-2 w-full">

                                            <div className="flex items-start justify-between w-full md:w-auto md:min-w-[240px]">
                                                <div className="flex items-center gap-3">
                                                    {/* CHECKBOX DE SELECCIÓN */}
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelection(product.id)}
                                                        className="w-5 h-5 rounded border-outline-variant dark:border-dark-outline text-primary dark:text-dark-primary focus:ring-primary dark:focus:ring-dark-primary dark:bg-dark-background dark:checked:bg-dark-primary dark:checked:border-dark-primary cursor-pointer transition-colors"
                                                    />

                                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center shrink-0 border dark:border-dark-outline ${isLowStock ? 'bg-error-container/20 text-error' : isSelected ? 'bg-primary text-on-primary dark:bg-dark-primary dark:text-dark-background' : 'bg-surface-container-high dark:bg-dark-background text-primary dark:text-dark-primary'}`}>
                                                        <span className="material-symbols-outlined text-[20px] md:text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                            {isLowStock ? 'warning' : 'icecream'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-headline-sm text-on-surface dark:text-dark-on-surface mb-0.5 font-bold uppercase text-xs md:text-sm tracking-tight line-clamp-1">{product.name}</h3>
                                                        {product.category_id == 1 ? (
                                                            <span className="bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest border dark:border-pink-500/20">TETA</span>
                                                        ) : (
                                                            <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest border dark:border-blue-500/20">HELADO</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Botones Visibles en Móvil */}
                                                <div className="flex md:hidden items-center gap-1">
                                                    <button onClick={() => setEditingId(product.id)} className="p-1.5 text-on-surface-variant dark:text-dark-on-surface-variant bg-surface-container-low dark:bg-dark-background rounded-md transition-colors border dark:border-dark-outline"><span className="material-symbols-outlined text-[16px]">edit_square</span></button>
                                                    <button onClick={() => setProductToDelete(product)} className="p-1.5 text-error/80 bg-error/10 dark:bg-error/5 rounded-md transition-colors border dark:border-error/20"><span className="material-symbols-outlined text-[16px]">delete_forever</span></button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 md:gap-6 w-full flex-grow items-center border-t border-outline-variant/30 dark:border-dark-outline/50 md:border-none pt-3 md:pt-0">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest mb-1 whitespace-nowrap">Stock</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className={`font-bold text-sm md:text-base leading-none ${isLowStock ? 'text-error' : 'text-on-surface dark:text-white'}`}>{product.stock}</span>
                                                        <span className="text-[9px] font-bold text-on-surface-variant dark:text-dark-on-surface-variant uppercase hidden sm:inline">und</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest mb-1 whitespace-nowrap">Precio Bs</span>
                                                    <span className="font-bold text-sm md:text-base text-on-surface dark:text-dark-on-surface leading-none mt-0.5">{precioBs}</span>
                                                </div>

                                                <div className="flex flex-col md:items-start items-end">
                                                    <span className="text-[9px] font-black text-primary dark:text-dark-primary uppercase tracking-widest mb-1 whitespace-nowrap">Ref USD</span>
                                                    <span className="font-black text-sm md:text-base text-primary dark:text-dark-primary leading-none mt-0.5">${precioUSD}</span>
                                                </div>
                                            </div>

                                            {/* Botones Visibles en PC */}
                                            <div className="hidden md:flex items-center gap-1 ml-2">
                                                <button onClick={() => setEditingId(product.id)} className="p-2 text-on-surface-variant dark:text-dark-on-surface-variant hover:text-primary dark:hover:text-dark-primary hover:bg-surface-container-high dark:hover:bg-dark-background rounded-full transition-colors border border-transparent dark:hover:border-dark-outline"><span className="material-symbols-outlined text-[20px]">edit_square</span></button>
                                                <button onClick={() => setProductToDelete(product)} className="p-2 text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error rounded-full hover:bg-error/10 transition-colors border border-transparent dark:hover:border-error/20"><span className="material-symbols-outlined text-[20px]">delete_forever</span></button>
                                            </div>

                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </main>

                {/* BARRA FLOTANTE DE ACCIONES MASIVAS */}
                {selectedIds.length > 0 && (
                    <div className="fixed bottom-[80px] md:bottom-md left-0 w-full px-margin-mobile md:px-margin-desktop z-40 flex justify-center animate-fade-in">
                        <div className="w-full max-w-2xl bg-surface dark:bg-dark-surface shadow-2xl rounded-2xl border dark:border-dark-outline p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background flex items-center justify-center font-black text-sm">
                                    {selectedIds.length}
                                </div>
                                <span className="font-bold text-on-surface dark:text-white uppercase tracking-wider text-sm">Items Seleccionados</span>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => setIsBulkEditModalOpen(true)}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-surface-container-high dark:bg-dark-background hover:bg-primary hover:text-on-primary dark:hover:bg-dark-primary dark:hover:text-dark-background text-on-surface dark:text-white px-4 py-2 rounded-lg font-black text-xs uppercase transition-all border dark:border-dark-outline"
                                >
                                    <span className="material-symbols-outlined text-[16px]">edit_square</span>
                                    Editar
                                </button>
                                <button
                                    onClick={() => setIsBulkDeleteModalOpen(true)}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-error/10 dark:bg-error/20 hover:bg-error text-error hover:text-onError px-4 py-2 rounded-lg font-black text-xs uppercase transition-all border border-error/20"
                                >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Eliminación Individual */}
            {productToDelete && (
                <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in transition-all">
                    <div className="bg-surface-container-lowest dark:bg-dark-surface rounded-xl p-lg w-full max-w-sm shadow-2xl border dark:border-dark-outline">
                        <div className="flex items-center gap-3 mb-4 text-error">
                            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0 border border-error/20">
                                <span className="material-symbols-outlined text-[24px]">warning_amber</span>
                            </div>
                            <h3 className="font-headline-sm font-bold text-on-surface dark:text-white uppercase tracking-tighter">Eliminar Producto</h3>
                        </div>
                        <p className="text-sm text-on-surface-variant dark:text-dark-on-surface-variant mb-6 leading-relaxed">¿Seguro que deseas eliminar <strong className="text-on-surface dark:text-white">"{productToDelete.name}"</strong>?</p>
                        <div className="flex justify-end gap-3 border-t border-outline-variant dark:border-dark-outline pt-4">
                            <button onClick={() => setProductToDelete(null)} className="px-4 py-2 text-on-surface-variant dark:text-dark-on-surface-variant font-black text-xs uppercase hover:bg-surface-container-high dark:hover:bg-dark-background rounded-lg transition-all border border-transparent dark:hover:border-dark-outline">Cancelar</button>
                            <button onClick={() => { router.delete(route('products.destroy', productToDelete.id), { onSuccess: () => { setProductToDelete(null); showToast('¡Producto eliminado del inventario!'); } }); }} className="px-5 py-2 bg-error text-onError hover:bg-error/90 font-black text-xs uppercase rounded-lg shadow-lg">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL ELIMINACIÓN MASIVA */}
            {isBulkDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in transition-all">
                    <div className="bg-surface-container-lowest dark:bg-dark-surface rounded-xl p-lg w-full max-w-sm shadow-2xl border dark:border-dark-outline">
                        <div className="flex items-center gap-3 mb-4 text-error">
                            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0 border border-error/20">
                                <span className="material-symbols-outlined text-[24px]">warning_amber</span>
                            </div>
                            <h3 className="font-headline-sm font-bold text-on-surface dark:text-white uppercase tracking-tighter">Eliminación Masiva</h3>
                        </div>
                        <p className="text-sm text-on-surface-variant dark:text-dark-on-surface-variant mb-6 leading-relaxed">Estás a punto de eliminar <strong className="text-on-surface dark:text-white">{selectedIds.length} productos</strong> al mismo tiempo. Esta acción es irreversible.</p>
                        <div className="flex justify-end gap-3 border-t border-outline-variant dark:border-dark-outline pt-4">
                            <button onClick={() => setIsBulkDeleteModalOpen(false)} className="px-4 py-2 text-on-surface-variant dark:text-dark-on-surface-variant font-black text-xs uppercase hover:bg-surface-container-high dark:hover:bg-dark-background rounded-lg transition-all border border-transparent dark:hover:border-dark-outline">Cancelar</button>
                            <button onClick={handleBulkDelete} className="px-5 py-2 bg-error text-onError hover:bg-error/90 font-black text-xs uppercase rounded-lg shadow-lg">Sí, Eliminar Todos</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EDICIÓN MASIVA (PRECIO Y/O STOCK) */}
            {isBulkEditModalOpen && (
                <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in transition-all">
                    <div className="bg-surface-container-lowest dark:bg-dark-surface rounded-xl p-lg w-full max-w-md shadow-2xl border dark:border-dark-outline">
                        <div className="flex justify-between items-center mb-md border-b dark:border-dark-outline pb-4">
                            <h3 className="font-headline-md text-on-surface dark:text-dark-on-surface font-black uppercase text-sm tracking-widest">Edición Masiva</h3>
                            <button onClick={() => { setIsBulkEditModalOpen(false); setBulkPriceBs(''); setBulkStock(''); }} className="text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-colors"><span className="material-symbols-outlined">close</span></button>
                        </div>

                        <p className="text-xs text-on-surface-variant dark:text-dark-on-surface-variant mb-4">
                            Modifica el precio, el stock, o ambos para los <strong className="text-on-surface dark:text-white">{selectedIds.length} items</strong> seleccionados. Deja en blanco lo que no quieras cambiar.
                        </p>

                        <div className="flex flex-col gap-4">
                            {/* Campo de Stock */}
                            <div>
                                <label className="font-label-md text-on-surface-variant dark:text-dark-on-surface-variant mb-1.5 block font-black text-[10px] uppercase tracking-widest">Nuevo Stock Global</label>
                                <input type="number" min="0" value={bulkStock} onChange={e => setBulkStock(e.target.value)} className="w-full bg-surface-container dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-lg px-3 py-2 text-on-surface dark:text-white font-black text-sm focus:border-primary dark:focus:border-dark-primary transition-colors" placeholder="Dejar en blanco para no cambiar" />
                            </div>

                            {/* Campos de Precio (Bidireccionales) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col justify-end">
                                    <label className="font-label-md text-on-surface-variant dark:text-dark-on-surface-variant mb-1.5 block font-black text-[10px] uppercase tracking-widest">Nuevo Precio (Bs)</label>
                                    <input type="number" step="0.01" min="0" value={bulkPriceBs} onChange={e => setBulkPriceBs(e.target.value)} className="w-full bg-surface-container dark:bg-dark-background border border-outline-variant dark:border-dark-outline rounded-lg px-3 py-2 text-on-surface dark:text-white font-black text-sm focus:border-primary dark:focus:border-dark-primary transition-colors" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="font-label-md text-primary dark:text-dark-primary mb-1.5 block font-black text-[10px] uppercase tracking-widest">Equivalente ($)</label>
                                    <input
                                        type="number"
                                        step="0.01" min="0"
                                        value={bulkPriceBs ? (bulkPriceBs / tasaBCV).toFixed(2) : ''}
                                        onChange={e => setBulkPriceBs((e.target.value * tasaBCV).toFixed(2))}
                                        className="w-full bg-primary/5 dark:bg-dark-primary/10 border border-primary/30 dark:border-dark-primary/30 rounded-lg px-3 py-2 text-primary dark:text-dark-primary font-black text-sm shadow-sm focus:border-primary dark:focus:border-dark-primary transition-colors"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 border-t border-outline-variant dark:border-dark-outline pt-4">
                            <button onClick={() => { setIsBulkEditModalOpen(false); setBulkPriceBs(''); setBulkStock(''); }} className="px-4 py-2 text-on-surface-variant dark:text-dark-on-surface-variant font-black text-xs uppercase hover:bg-surface-container-high dark:hover:bg-dark-background transition-all rounded-lg border border-transparent dark:hover:border-dark-outline">Cancelar</button>
                            <button
                                onClick={handleBulkEdit}
                                disabled={!bulkPriceBs && !bulkStock}
                                className="px-6 py-2 bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background font-black text-xs uppercase rounded-lg hover:opacity-90 disabled:opacity-50 shadow-lg border dark:border-dark-primary/20"
                            >
                                Aplicar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Nuevo Producto */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in transition-all">
                    <div className="bg-surface-container-lowest dark:bg-dark-surface rounded-xl p-lg w-full max-w-md shadow-2xl border dark:border-dark-outline">
                        <div className="flex justify-between items-center mb-md border-b dark:border-dark-outline pb-4">
                            <h3 className="font-headline-md text-on-surface dark:text-dark-on-surface font-black uppercase text-sm tracking-widest">Registrar Nuevo Item</h3>
                            <button onClick={() => { setIsCreateModalOpen(false); reset(); }} className="text-on-surface-variant dark:text-dark-on-surface-variant hover:text-error transition-colors"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <form onSubmit={submitCreate} className="flex flex-col gap-4 mt-4">
                            <div>
                                <label className="font-label-md text-on-surface-variant dark:text-dark-on-surface-variant mb-1.5 block font-black text-[10px] uppercase tracking-widest">Nombre del Producto</label>
                                <input type="text" required value={data.name} onChange={e => setData('name', e.target.value)} className={`w-full bg-surface-container dark:bg-dark-background border rounded-lg px-3 py-2 text-on-surface dark:text-white transition-colors text-sm ${errors.name ? 'border-error focus:border-error' : 'border-outline-variant dark:border-dark-outline focus:border-primary dark:focus:border-dark-primary'}`} placeholder="Ej. Teta de Nutella" />
                                {errors.name && <p className="text-error text-[10px] font-bold uppercase tracking-wider mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="font-label-md text-on-surface-variant dark:text-dark-on-surface-variant mb-1.5 block font-black text-[10px] uppercase tracking-widest">Categoría</label>
                                <select value={data.category_id} onChange={e => setData('category_id', e.target.value)} className={`w-full bg-surface-container dark:bg-dark-background border rounded-lg px-3 py-2 text-on-surface dark:text-white transition-colors text-sm ${errors.category_id ? 'border-error focus:border-error' : 'border-outline-variant dark:border-dark-outline focus:border-primary dark:focus:border-dark-primary'}`}>
                                    <option value="1">Tetas</option>
                                    <option value="2">Helados</option>
                                </select>
                                {errors.category_id && <p className="text-error text-[10px] font-bold uppercase tracking-wider mt-1">{errors.category_id}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="font-label-md text-on-surface-variant dark:text-dark-on-surface-variant mb-1.5 block font-black text-[10px] uppercase tracking-widest whitespace-nowrap">Stock Inicial</label>
                                    <input type="number" required min="0" value={data.stock} onChange={e => setData('stock', e.target.value)} className={`w-full bg-surface-container dark:bg-dark-background border rounded-lg px-3 py-2 text-on-surface dark:text-white text-sm transition-colors ${errors.stock ? 'border-error focus:border-error' : 'border-outline-variant dark:border-dark-outline focus:border-primary dark:focus:border-dark-primary'}`} />
                                    {errors.stock && <p className="text-error text-[10px] font-bold uppercase tracking-wider mt-1">{errors.stock}</p>}
                                </div>
                                <div>
                                    <label className="font-label-md text-on-surface-variant dark:text-dark-on-surface-variant mb-1.5 block font-black text-[10px] uppercase tracking-widest whitespace-nowrap">Precio (Bs)</label>
                                    <input type="number" required step="0.01" min="0" value={data.price} onChange={e => setData('price', e.target.value)} className={`w-full bg-surface-container dark:bg-dark-background border rounded-lg px-3 py-2 text-on-surface dark:text-white font-black text-sm transition-colors ${errors.price ? 'border-error focus:border-error' : 'border-outline-variant dark:border-dark-outline focus:border-primary dark:focus:border-dark-primary'}`} />
                                    {errors.price && <p className="text-error text-[10px] font-bold uppercase tracking-wider mt-1">{errors.price}</p>}
                                </div>
                                <div>
                                    <label className="font-label-md text-primary dark:text-dark-primary mb-1.5 block font-black text-[10px] uppercase tracking-widest whitespace-nowrap">Precio ($)</label>
                                    <input
                                        type="number"
                                        required step="0.01" min="0"
                                        value={data.price ? (data.price / tasaBCV).toFixed(2) : ''}
                                        onChange={e => setData('price', (e.target.value * tasaBCV).toFixed(2))}
                                        className="w-full bg-primary/5 dark:bg-dark-primary/10 border border-primary/30 dark:border-dark-primary/30 rounded-lg px-3 py-2 text-primary dark:text-dark-primary font-black text-sm focus:border-primary dark:focus:border-dark-primary shadow-sm transition-colors"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {Object.keys(errors).length > 0 && (
                                <div className="p-3 bg-error/10 border border-error/30 rounded-lg">
                                    <p className="text-error font-bold text-[10px] uppercase tracking-widest">Por favor, corrige los errores antes de guardar.</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-2 border-t border-outline-variant dark:border-dark-outline pt-4">
                                <button type="button" onClick={() => { setIsCreateModalOpen(false); reset(); }} className="px-4 py-2 text-on-surface-variant dark:text-dark-on-surface-variant font-black text-xs uppercase hover:bg-surface-container-high dark:hover:bg-dark-background transition-all rounded-lg border border-transparent dark:hover:border-dark-outline">Cancelar</button>
                                <button type="submit" disabled={processing} className="px-6 py-2 bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background font-black text-xs uppercase rounded-lg hover:opacity-90 disabled:opacity-50 shadow-lg border dark:border-dark-primary/20">
                                    {processing ? 'Procesando...' : 'Guardar Item'}
                                </button>
                            </div>
                        </form>
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
        </MainLayout>
    );
}