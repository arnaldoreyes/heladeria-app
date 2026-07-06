import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import IconSelector from './IconSelector';

export default function CategoryManagerModal({ isOpen, onClose, categories }) {
    const [view, setView] = useState('list'); // 'list' | 'create' | 'edit'
    const [editingCat, setEditingCat] = useState(null);

    const { data, setData, post, put, delete: destroy, reset, errors, processing } = useForm({
        name: '',
        description: '',
        icon: 'icecream'
    });

    if (!isOpen) return null;

    const handleCreate = () => {
        reset();
        setView('create');
    };

    const handleEdit = (category) => {
        setEditingCat(category);
        setData({
            name: category.name,
            description: category.description || '',
            icon: category.icon || 'icecream'
        });
        setView('edit');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (view === 'create') {
            post(route('categories.store'), {
                onSuccess: () => setView('list'),
            });
        } else if (view === 'edit') {
            put(route('categories.update', editingCat.id), {
                onSuccess: () => setView('list'),
            });
        }
    };

    const handleDelete = (id) => {
        if (id === 1) {
            alert('No puedes eliminar la categoría principal.');
            return;
        }
        if (confirm('¿Estás seguro de que deseas eliminar esta categoría? Sus productos pasarán a la categoría por defecto (Helado).')) {
            destroy(route('categories.destroy', id));
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-surface dark:bg-dark-surface w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border dark:border-dark-outline flex flex-col max-h-[90vh]">
                <div className="px-5 py-4 border-b border-outline-variant/30 dark:border-dark-outline flex justify-between items-center bg-surface-bright dark:bg-dark-surface-container">
                    <h2 className="font-headline-sm text-lg font-black text-on-surface dark:text-white uppercase tracking-tight">
                        {view === 'list' ? 'Gestión de Categorías' : view === 'create' ? 'Nueva Categoría' : 'Editar Categoría'}
                    </h2>
                    <button onClick={onClose} className="text-on-surface-variant hover:text-error transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-5 overflow-y-auto custom-scrollbar flex-grow">
                    {view === 'list' ? (
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleCreate}
                                className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary dark:bg-dark-primary/10 dark:text-dark-primary py-3 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors font-black uppercase text-xs"
                            >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                Crear Nueva Categoría
                            </button>
                            
                            <div className="flex flex-col gap-2 mt-2">
                                {categories.map(cat => (
                                    <div key={cat.id} className="flex justify-between items-center p-3 rounded-lg border border-outline-variant/50 dark:border-dark-outline bg-surface-container-lowest dark:bg-dark-background">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary dark:bg-dark-primary/10 dark:text-dark-primary shrink-0 border border-primary/20">
                                                <span className="material-symbols-outlined text-[20px]">{cat.icon || 'icecream'}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-on-surface dark:text-white text-sm uppercase tracking-tight">{cat.name}</h4>
                                                <p className="text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant line-clamp-1">{cat.description || 'Sin descripción'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleEdit(cat)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary dark:text-dark-on-surface-variant transition-colors rounded-full hover:bg-surface-container">
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                            {cat.id !== 1 && (
                                                <button onClick={() => handleDelete(cat.id)} className="w-8 h-8 flex items-center justify-center text-error/70 hover:text-error transition-colors rounded-full hover:bg-surface-container">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Nombre de la Categoría</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full h-10 border border-outline-variant dark:border-dark-outline bg-surface-container-lowest dark:bg-dark-background rounded-lg px-3 text-sm focus:border-primary"
                                    required
                                />
                                {errors.name && <p className="text-error text-xs mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Descripción (Opcional)</label>
                                <input
                                    type="text"
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    className="w-full h-10 border border-outline-variant dark:border-dark-outline bg-surface-container-lowest dark:bg-dark-background rounded-lg px-3 text-sm focus:border-primary"
                                />
                                {errors.description && <p className="text-error text-xs mt-1">{errors.description}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Icono representativo</label>
                                <IconSelector value={data.icon} onChange={icon => setData('icon', icon)} />
                                {errors.icon && <p className="text-error text-xs mt-1">{errors.icon}</p>}
                            </div>
                            
                            <div className="flex gap-2 mt-4">
                                <button type="button" onClick={() => setView('list')} className="flex-1 py-3 rounded-lg border border-outline-variant dark:border-dark-outline font-black uppercase text-xs hover:bg-surface-container transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={processing} className="flex-1 py-3 rounded-lg bg-primary text-on-primary dark:bg-dark-primary dark:text-dark-background font-black uppercase text-xs hover:opacity-90 transition-opacity">
                                    Guardar
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
