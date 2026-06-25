import { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

export default function Index({ config }) {
    const { errors: flashErrors } = usePage().props;
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [toast, setToast] = useState('');

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(''), 3000);
    };

    // Inicialización limpia del formulario con la data inyectada desde el controlador
    const { data, setData, post, processing, errors } = useForm({
        bcv_mode: config.bcv_mode,
        bcv_manual_rate: config.bcv_manual_rate || '',
        profit_percentage: config.profit_percentage,
        business_percentage: config.business_percentage,
    });

    const sanitizeDecimal = (val) => {
        let v = String(val).replace(',', '.').replace(/[^0-9.]/g, '');
        const p = v.split('.');
        if (p.length > 2) v = p[0] + '.' + p.slice(1).join('').replace(/\./g, '');
        return v;
    };

    const sanitizeInteger = (val) => String(val).replace(/\D/g, '');

    // Sincronización interactiva: Modificar un porcentaje calcula automáticamente el recíproco
    const handleProfitChange = (val) => {
        const profit = Number(sanitizeInteger(val));
        if (profit <= 100) {
            setData(prev => ({
                ...prev,
                profit_percentage: profit,
                business_percentage: 100 - profit
            }));
        }
    };

    const handleBusinessChange = (val) => {
        const business = Number(sanitizeInteger(val));
        if (business <= 100) {
            setData(prev => ({
                ...prev,
                business_percentage: business,
                profit_percentage: 100 - business
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.update'), {
            preserveScroll: true,
            onSuccess: () => showToast('Configuración guardada exitosamente'),
        });
    };

    const handleForceRefresh = () => {
        setIsRefreshing(true);
        router.post(route('settings.forceApi'), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setIsRefreshing(false);
                showToast('Tasa actualizada desde DolarAPI');
                // Sincroniza el estado local del formulario si cambió el modo a auto
                setData(prev => ({ ...prev, bcv_mode: 'auto' }));
            },
            onError: () => setIsRefreshing(false)
        });
    };

    return (
        <MainLayout>
            <Head title="Configuración Sistema" />

            <main className="pt-8 md:pt-[40px] px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto flex flex-col gap-lg h-full pb-20 transition-colors">

                <div className="border-b border-outline-variant/30 dark:border-dark-outline pb-4 mb-2">
                    <h1 className="font-headline-lg text-headline-lg text-on-background dark:text-dark-on-surface font-bold tracking-tight">
                        Configuración General
                    </h1>
                    <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant mt-1">
                        Control de variables globales del negocio, tasas de cambio y márgenes financieros.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">

                    {/* SECCIÓN 1: TASA DE CAMBIO */}
                    <div className="bg-surface-container-lowest dark:bg-dark-surface border border-outline-variant dark:border-dark-outline rounded-xl p-5 shadow-sm flex flex-col gap-4">
                        <h3 className="font-label-lg text-primary dark:text-dark-primary font-black uppercase tracking-widest text-xs flex items-center gap-2 border-b dark:border-dark-outline pb-3">
                            <span className="material-symbols-outlined text-[18px]">monetization_on</span>
                            Referencia Cambiaria (BCV)
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-2">
                            {/* Selector de Modo */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Modo de Operación</label>
                                <div className="grid grid-cols-2 bg-surface-container-low dark:bg-dark-background border dark:border-dark-outline p-1 rounded-lg h-10 items-center">
                                    <button
                                        type="button"
                                        onClick={() => setData('bcv_mode', 'auto')}
                                        className={`h-full rounded-md text-xs font-black uppercase tracking-wider transition-all ${data.bcv_mode === 'auto'
                                            ? 'bg-primary text-on-primary dark:bg-dark-primary dark:text-dark-background shadow-sm'
                                            : 'text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-high dark:hover:bg-neutral-800'
                                            }`}
                                    >
                                        Automático
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('bcv_mode', 'manual')}
                                        className={`h-full rounded-md text-xs font-black uppercase tracking-wider transition-all ${data.bcv_mode === 'manual'
                                            ? 'bg-primary text-on-primary dark:bg-dark-primary dark:text-dark-background shadow-sm'
                                            : 'text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-high dark:hover:bg-neutral-800'
                                            }`}
                                    >
                                        Manual
                                    </button>
                                </div>
                            </div>

                            {/* Campo de Entrada de Tasa */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                                    Tasa Manual (Bs)
                                </label>
                                <div className="relative h-10">
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        disabled={data.bcv_mode === 'auto'}
                                        value={data.bcv_mode === 'auto' ? Number(config.last_bcv_rate).toFixed(2) : data.bcv_manual_rate}
                                        onChange={e => setData('bcv_manual_rate', sanitizeDecimal(e.target.value))}
                                        placeholder="0.00"
                                        className="w-full h-full rounded-lg bg-surface-container-low dark:bg-dark-background border border-outline-variant dark:border-dark-outline focus:border-primary dark:focus:border-dark-primary text-sm font-bold disabled:opacity-50 disabled:bg-surface-container-high/40 dark:disabled:bg-neutral-900 transition-all pl-3 pr-10 outline-none"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-on-surface-variant opacity-60">BS</span>
                                </div>
                                {errors.bcv_manual_rate && <p className="text-error text-[10px] font-bold uppercase tracking-wider mt-1">{errors.bcv_manual_rate}</p>}
                            </div>
                        </div>

                        {/* Botón de consulta forzada exclusivo para el modo automático */}
                        {data.bcv_mode === 'auto' && (
                            <div className="flex justify-end mt-2">
                                <button
                                    type="button"
                                    disabled={isRefreshing}
                                    onClick={handleForceRefresh}
                                    className="flex items-center gap-1.5 px-4 h-9 rounded-lg border border-outline-variant dark:border-dark-outline text-primary dark:text-dark-primary font-black text-xs uppercase tracking-wider hover:bg-primary/5 dark:hover:bg-dark-primary/5 transition-colors disabled:opacity-50"
                                >
                                    <span className={`material-symbols-outlined text-[16px] ${isRefreshing ? 'animate-spin' : ''}`}>refresh</span>
                                    Actualizar Tasa Del Dolar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN 2: DISTRIBUCIÓN DE INGRESOS */}
                    <div className="bg-surface-container-lowest dark:bg-dark-surface border border-outline-variant dark:border-dark-outline rounded-xl p-5 shadow-sm flex flex-col gap-4">
                        <h3 className="font-label-lg text-primary dark:text-dark-primary font-black uppercase tracking-widest text-xs flex items-center gap-2 border-b dark:border-dark-outline pb-3">
                            <span className="material-symbols-outlined text-[18px]">percent</span>
                            Regla de Distribución de Caja
                        </h3>

                        <p className="text-xs text-on-surface-variant dark:text-dark-on-surface-variant leading-relaxed">
                            Determina los porcentajes automáticos para la separación del dinero bruto al cerrar caja. Ambos campos se encuentran vinculados para asegurar una consistencia contable exacta.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-2">
                            {/* Porcentaje Ganancia Personal */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Tu Ganancia (40%)</label>
                                <div className="relative h-10">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        required
                                        value={data.profit_percentage}
                                        onChange={e => handleProfitChange(e.target.value)}
                                        className="w-full h-full rounded-lg bg-surface-container-low dark:bg-dark-background border border-outline-variant dark:border-dark-outline focus:border-primary dark:focus:border-dark-primary text-sm font-bold transition-all pl-3 pr-10 outline-none"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-on-surface-variant opacity-60">%</span>
                                </div>
                            </div>

                            {/* Porcentaje Fondo del Negocio */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Fondo de Negocio (60%)</label>
                                <div className="relative h-10">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        required
                                        value={data.business_percentage}
                                        onChange={e => handleBusinessChange(e.target.value)}
                                        className="w-full h-full rounded-lg bg-surface-container-low dark:bg-dark-background border border-outline-variant dark:border-dark-outline focus:border-primary dark:focus:border-dark-primary text-sm font-bold transition-all pl-3 pr-10 outline-none"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-on-surface-variant opacity-60">%</span>
                                </div>
                            </div>
                        </div>

                        {/* Manejo centralizado de errores de porcentaje */}
                        {(errors.profit_percentage || errors.business_percentage || flashErrors.percentages) && (
                            <p className="text-error text-[10px] font-bold uppercase tracking-wider mt-1">
                                {errors.profit_percentage || errors.business_percentage || flashErrors.percentages}
                            </p>
                        )}
                    </div>

                    {/* BOTÓN PRINCIPAL DE GUARDADO */}
                    <div className="flex justify-end mt-4 border-t border-outline-variant/30 dark:border-dark-outline pt-4 shrink-0">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full md:w-auto px-8 py-3 bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background font-black text-sm uppercase rounded-lg shadow-md hover:opacity-90 disabled:opacity-50 transition-all border dark:border-dark-primary/20 flex justify-center items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            Guardar Configuración
                        </button>
                    </div>

                </form>
            </main>

            {/* NOTIFICACIÓN TIPO TOAST */}
            {toast && (
                <div className="fixed top-24 right-4 bg-primary dark:bg-dark-primary text-on-primary dark:text-dark-background px-6 py-3 rounded-lg shadow-2xl z-[200] font-black animate-fade-in flex items-center gap-2 border dark:border-dark-primary/30">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span className="text-xs uppercase tracking-widest">{toast}</span>
                </div>
            )}
        </MainLayout>
    );
}