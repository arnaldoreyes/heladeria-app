import React from 'react';

export default function CategoryFilter({ categories, selectedCategory, onSelectCategory }) {
    if (!categories || categories.length <= 1) return null;

    return (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
            <button
                onClick={() => onSelectCategory(null)}
                className={`flex-shrink-0 px-5 py-2 rounded-full font-black text-xs uppercase border transition-all ${
                    selectedCategory === null
                        ? 'bg-primary text-on-primary border-primary dark:bg-dark-primary dark:text-dark-background'
                        : 'bg-surface-container text-on-surface-variant border-transparent hover:bg-surface-container-high'
                }`}
            >
                Todos
            </button>
            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-xs uppercase border transition-all ${
                        selectedCategory === cat.id
                            ? 'bg-primary text-on-primary border-primary dark:bg-dark-primary dark:text-dark-background'
                            : 'bg-surface-container text-on-surface-variant border-transparent hover:bg-surface-container-high'
                    }`}
                >
                    <span className="material-symbols-outlined text-[18px]">{cat.icon || 'icecream'}</span>
                    {cat.name}
                </button>
            ))}
        </div>
    );
}
