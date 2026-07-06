import React from 'react';

const iconsList = [
    'category', 'inventory_2', 'shopping_bag', 'sell', 'redeem',
    'icecream', 'cake', 'cookie', 'fastfood', 'local_pizza',
    'lunch_dining', 'restaurant', 'bakery_dining', 'kebab_dining', 'takeout_dining',
    'local_cafe', 'liquor', 'water_drop', 'sports_bar', 'wine_bar'
];

export default function IconSelector({ value, onChange }) {
    return (
        <div className="grid grid-cols-5 gap-2 mt-2">
            {iconsList.map(icon => (
                <button
                    key={icon}
                    type="button"
                    onClick={() => onChange(icon)}
                    className={`flex items-center justify-center p-3 rounded-lg border transition-all ${
                        value === icon
                            ? 'bg-primary/10 border-primary text-primary dark:bg-dark-primary/10 dark:border-dark-primary dark:text-dark-primary'
                            : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container-high dark:bg-dark-surface dark:border-dark-outline dark:text-dark-on-surface-variant dark:hover:bg-dark-surface-container'
                    }`}
                    title={icon}
                >
                    <span className="material-symbols-outlined text-[24px] overflow-hidden whitespace-nowrap w-6 h-6 flex items-center justify-center">{icon}</span>
                </button>
            ))}
        </div>
    );
}
