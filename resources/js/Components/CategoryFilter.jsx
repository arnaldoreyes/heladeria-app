import React from 'react';

export default function CategoryFilter({ categories, selectedCategory, onSelectCategory }) {
    const catsList = Array.isArray(categories) ? categories : Object.values(categories || {});
    if (!catsList || catsList.length <= 1) return null;

    return (
        <div className="flex flex-wrap gap-1.5 mb-4">
            <button
                onClick={() => onSelectCategory(null)}
                className={`px-4 py-1.5 rounded-full font-black text-[11px] uppercase border transition-all ${
                    selectedCategory === null
                        ? 'bg-primary text-on-primary border-primary dark:bg-dark-primary dark:text-dark-background'
                        : 'bg-surface-container text-on-surface-variant border-transparent hover:bg-surface-container-high'
                }`}
            >
                Todos
            </button>
            {catsList.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-black text-[11px] uppercase border transition-all ${
                        selectedCategory === cat.id
                            ? 'bg-primary text-on-primary border-primary dark:bg-dark-primary dark:text-dark-background'
                            : 'bg-surface-container text-on-surface-variant border-transparent hover:bg-surface-container-high'
                    }`}
                >
                    <span className="material-symbols-outlined text-[16px]">{cat.icon || 'icecream'}</span>
                    {cat.name}
                </button>
            ))}
        </div>
    );
}
