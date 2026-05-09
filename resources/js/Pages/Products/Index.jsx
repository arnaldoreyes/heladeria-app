import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

export default function Index({ auth, products }) {
    // Tasa BCV temporal
    const tasaBCV = 39.50;

    // Estado para controlar qué producto se está editando (null = ninguno)
    const [editingId, setEditingId] = useState(null);

    // Lógica visual del porcentaje de stock (Max estimado 100 para la barra)
    const getStockPercentage = (stock) => Math.min((stock / 100) * 100, 100);

    // Estado para abrir/cerrar el modal de creación
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Estado para controlar el modal de eliminación (guarda el producto a eliminar o null)
    const [productToDelete, setProductToDelete] = useState(null);

    // Formulario reactivo de Inertia
    const { data, setData, post, processing, reset } = useForm({
        name: '',
        stock: 0,
        price: 0,
        category_id: 1,
    });

    // Función para enviar el formulario
    const submitCreate = (e) => {
        e.preventDefault();
        post(route('products.store'), {
            onSuccess: () => {
                setIsCreateModalOpen(false); // Cierra el modal
                reset(); // Limpia los campos para la próxima vez
            }
        });
    };

    return (
        <MainLayout>
            <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col pb-[80px] md:pb-0">
                <Head title="Inventario" />

                {/* Main Content Canvas */}
                <main className="flex-grow w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-md md:py-xl">

                    {/* Header & Global Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-lg gap-sm md:gap-0">
                        <div>
                            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs font-bold">Gestión de Inventario</h2>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">Administra niveles de stock, categorías y precios.</p>
                        </div>
                        <div className="flex items-center gap-sm w-full md:w-auto mt-sm md:mt-0">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-primary text-on-primary hover:opacity-90 transition-opacity px-6 py-2 rounded-lg shadow-md flex items-center gap-2 font-body-md text-body-md font-bold ml-auto md:ml-0"
                            >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                Nuevo Producto
                            </button>
                        </div>
                    </div>

                    {/* Inventory Dashboard List */}
                    <div className="flex flex-col gap-sm">
                        {products.length === 0 ? (
                            <div className="text-center p-8 bg-surface-container-lowest rounded-xl border border-outline-variant text-on-surface-variant">
                                No hay productos registrados.
                            </div>
                        ) : (
                            products.map(product => {
                                const isEditing = editingId === product.id;
                                const isLowStock = product.stock <= 5; // Lógica de stock bajo
                                const precioUSD = (product.price / tasaBCV).toFixed(2);
                                const precioBs = Number(product.price).toFixed(2);

                                // --- MODO EDICIÓN ---
                                if (isEditing) {
                                    return (
                                        <div key={product.id} className="bg-surface-container-lowest border-2 border-primary rounded-xl p-md shadow-md transition-shadow relative overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md">

                                                {/* 1. SECCIÓN IZQUIERDA: Ícono, Nombre y Selector de Categoría */}
                                                <div className="flex items-center gap-md min-w-[240px] w-full md:w-1/3">
                                                    <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                                                        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>icecream</span>
                                                    </div>
                                                    <div className="w-full flex flex-col gap-2">
                                                        <input
                                                            id={`edit_name_${product.id}`}
                                                            className="font-headline-sm text-headline-sm text-on-surface bg-surface-container-lowest border border-outline-variant rounded-md px-2 py-1 w-full focus:border-primary focus:ring-1 focus:ring-primary font-bold"
                                                            type="text"
                                                            defaultValue={product.name}
                                                        />
                                                        {/* El selector ahora vive aquí abajo del nombre */}
                                                        <select
                                                            id={`edit_category_${product.id}`}
                                                            className="font-label-md text-on-surface bg-surface-container-lowest border border-outline-variant rounded-md px-2 py-1 focus:border-primary focus:ring-1 focus:ring-primary w-full md:w-4/5"
                                                            defaultValue={product.category_id}
                                                        >
                                                            <option value="1">Helados</option>
                                                            <option value="2">Tetas</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* 2. SECCIÓN CENTRAL: Stock y Precios */}
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-md md:gap-lg w-full md:w-auto flex-grow mt-4 md:mt-0">
                                                    <div className="flex flex-col">
                                                        <span className="font-label-md text-label-md text-on-surface-variant mb-1 font-bold">STOCK</span>
                                                        <div className="flex items-center gap-2">
                                                            <input id={`edit_stock_${product.id}`} className="font-headline-sm text-headline-sm text-on-surface bg-surface-container-lowest border border-outline-variant rounded-md px-2 py-1 w-20 focus:border-primary focus:ring-1 focus:ring-primary font-bold" type="number" defaultValue={product.stock} />
                                                            <span className="text-body-sm text-on-surface-variant">und</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col">
                                                        <span className="font-label-md text-label-md text-primary font-black mb-1">PRECIO (BS)</span>
                                                        <div className="relative">
                                                            <input id={`edit_price_${product.id}`} className="font-body-md text-body-md text-on-surface bg-primary-container/10 border border-primary rounded-md px-2 py-1 w-24 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm font-bold" step="0.01" type="number" defaultValue={precioBs} />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col">
                                                        <span className="font-label-md text-label-md text-on-surface-variant mb-1 font-bold">PRECIO (USD)</span>
                                                        <span className="font-body-md text-body-md text-on-surface-variant px-2 py-1 bg-surface-container-low rounded-md inline-block w-24 text-right font-bold">
                                                            ~ ${precioUSD}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* 3. SECCIÓN DERECHA: Botones */}
                                                <div className="flex items-center justify-end w-full md:w-auto gap-2 border-t md:border-t-0 border-outline-variant pt-md md:pt-0 mt-4 md:mt-0">
                                                    <button
                                                        onClick={() => {
                                                            const newName = document.getElementById(`edit_name_${product.id}`).value;
                                                            const newStock = document.getElementById(`edit_stock_${product.id}`).value;
                                                            const newPriceBs = document.getElementById(`edit_price_${product.id}`).value;
                                                            const newCategory = document.getElementById(`edit_category_${product.id}`).value;

                                                            router.put(route('products.update', product.id), {
                                                                name: newName,
                                                                stock: newStock,
                                                                price: newPriceBs,
                                                                category_id: newCategory
                                                            }, {
                                                                onSuccess: () => setEditingId(null)
                                                            });
                                                        }}
                                                        className="bg-primary text-on-primary hover:opacity-90 px-4 py-1.5 rounded-lg text-body-sm font-bold transition-opacity"
                                                    >
                                                        Guardar
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="text-on-surface-variant hover:text-error px-3 py-1.5 rounded-lg text-body-sm font-bold transition-colors border border-transparent hover:border-outline-variant"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                // --- MODO VISTA NORMAL ---
                                return (
                                    <div key={product.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isLowStock ? 'bg-error' : 'bg-primary'}`}></div>
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md">

                                            <div className="flex items-center gap-md min-w-[240px]">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${isLowStock ? 'bg-error-container text-error' : 'bg-surface-container-high text-primary'}`}>
                                                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                        {isLowStock ? 'warning' : 'icecream'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1 font-bold">{product.name}</h3>
                                                    <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase">
                                                        {product.category_id == 1 ? 'HELADO' : 'TETA'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-md md:gap-lg w-full md:w-auto flex-grow">
                                                <div className="flex flex-col">
                                                    <span className="font-label-md text-label-md text-on-surface-variant mb-1 font-bold">STOCK</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-headline-sm text-headline-sm font-black ${isLowStock ? 'text-error' : 'text-on-surface'}`}>{product.stock}</span>
                                                        <span className="text-body-sm text-on-surface-variant">und</span>
                                                    </div>
                                                    <div className="w-full bg-surface-container h-1.5 rounded-full mt-2">
                                                        <div className={`${isLowStock ? 'bg-error' : 'bg-primary'} h-1.5 rounded-full`} style={{ width: `${getStockPercentage(product.stock)}%` }}></div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="font-label-md text-label-md text-on-surface-variant mb-1 font-bold">PRECIO (BS)</span>
                                                    <span className="font-body-md text-body-md text-on-surface font-bold">{precioBs} Bs</span>
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="font-label-md text-label-md text-on-surface-variant mb-1 font-bold">PRECIO (USD)</span>
                                                    <span className="font-body-md text-body-md text-on-surface-variant px-2 py-1 bg-surface-container-low rounded-md inline-block w-24 text-right font-bold">
                                                        ${precioUSD}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end w-full md:w-auto gap-2 border-t md:border-t-0 border-outline-variant pt-md md:pt-0 mt-2 md:mt-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setEditingId(product.id)}
                                                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-full transition-colors"
                                                    title="Editar"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => setProductToDelete(product)}
                                                    className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-lg hover:bg-error/10"
                                                    title="Eliminar producto"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </main>
            </div>
            {/* Modal Personalizado de Confirmación de Eliminación */}
            {productToDelete && (
                <div className="fixed inset-0 bg-on-background/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface-container-lowest rounded-xl p-lg w-full max-w-sm shadow-2xl">

                        <div className="flex items-center gap-3 mb-4 text-error">
                            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[24px]">warning</span>
                            </div>
                            <h3 className="font-headline-sm font-bold text-on-surface">¿Eliminar Producto?</h3>
                        </div>

                        <p className="text-body-md text-on-surface-variant mb-6 ml-1">
                            Estás a punto de eliminar <strong>"{productToDelete.name}"</strong>. Esta acción no se puede deshacer.
                        </p>

                        <div className="flex justify-end gap-2 border-t border-outline-variant pt-4">
                            <button
                                onClick={() => setProductToDelete(null)}
                                className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container-high rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    router.delete(route('products.destroy', productToDelete.id), {
                                        onSuccess: () => setProductToDelete(null) // Cierra el modal si se borró con éxito
                                    });
                                }}
                                className="px-4 py-2 bg-error text-onError hover:bg-error/90 font-bold rounded-lg shadow-sm transition-colors"
                            >
                                Sí, Eliminar
                            </button>
                        </div>

                    </div>
                </div>
            )}
            {/* Modal de Nuevo Producto */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-on-background/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface-container-lowest rounded-xl p-lg w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-md">
                            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Registrar Producto</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-on-surface-variant hover:text-error">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={submitCreate} className="flex flex-col gap-4">
                            <div>
                                <label className="font-label-md text-on-surface-variant mb-1 block font-bold">Nombre del Producto</label>
                                <input
                                    type="text"
                                    required
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary text-on-surface"
                                    placeholder="Ej. Teta de Nutella"
                                />
                            </div>

                            <div>
                                <label className="font-label-md text-on-surface-variant mb-1 block font-bold">Categoría</label>
                                <select
                                    value={data.category_id}
                                    onChange={e => setData('category_id', e.target.value)}
                                    className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary text-on-surface"
                                >
                                    <option value="1">Helados</option>
                                    <option value="2">Tetas</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="font-label-md text-on-surface-variant mb-1 block font-bold">Stock Inicial</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={data.stock}
                                        onChange={e => setData('stock', e.target.value)}
                                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary text-on-surface"
                                    />
                                </div>
                                <div>
                                    <label className="font-label-md text-on-surface-variant mb-1 block font-bold">Precio (Bs)</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        min="0"
                                        value={data.price}
                                        onChange={e => setData('price', e.target.value)}
                                        className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary text-on-surface"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-outline-variant">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container-high rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {processing ? 'Guardando...' : 'Guardar Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}