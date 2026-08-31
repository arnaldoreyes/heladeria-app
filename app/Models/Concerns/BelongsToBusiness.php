<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

trait BelongsToBusiness
{
    protected static function bootBelongsToBusiness()
    {
        // Global Scope para lectura automática
        static::addGlobalScope('business', function (Builder $builder) {
            // 1. Si estamos en la consola (Artisan, migraciones, seeders), no restringimos
            if (app()->runningInConsole()) {
                return;
            }

            // 2. Si hay un usuario autenticado y es Superadmin, lo dejamos pasar sin filtro
           if (auth()->user()->hasRole('superadmin')) {
                    return;
                }



            // 3. Si hay un negocio activo en el contenedor, aplicamos el filtro de seguridad
            if (auth()->check() && auth()->user()->business_id) {
                $table = $builder->getModel()->getTable();
                $builder->where("{$table}.business_id", auth()->user()->business_id);
            }
        });

        // Asegurar que al crear un registro se le asigne el business_id automáticamente
        static::creating(function (Model $model) {
            if (empty($model->business_id) && auth()->check() && auth()->user()->business_id) {
                $model->business_id = auth()->user()->business_id;
            }
        });
    }


}
