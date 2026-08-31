<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $guard = 'sanctum';

        // Limpiar caché de permisos
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Definir Permisos por Nivel de Acceso
        $cashier_permissions = [
            'products.index', 'products.show',
            'categories.index', 'categories.show',
            'sales.index', 'sales.show', 'sales.create',
            'customers.index', 'customers.show', 'customers.create', 'customers.update',
        ];

        $owner_permissions = array_merge($cashier_permissions, [
            // Gestión total del catálogo
            'products.create', 'products.update', 'products.delete',
            'categories.create', 'categories.update', 'categories.delete',

            // Permisos destructivos de ventas/clientes
            'sales.update', 'sales.delete',
            'customers.delete',

            // Módulos administrativos del negocio
            'inventory.index', 'inventory.show', 'inventory.create', 'inventory.update', 'inventory.delete',
            'expenses.index', 'expenses.show', 'expenses.create', 'expenses.update', 'expenses.delete',
            'payments.index', 'payments.show', 'payments.create', 'payments.update', 'payments.delete',

            // Configuración y Análisis
            'analytics.index',
            'settings.index', 'settings.update',

            // Gestión de empleados
            'users.index', 'users.show', 'users.create', 'users.update', 'users.delete',
        ]);

        $superadmin_permissions = array_merge($owner_permissions, [
            // Operaciones masivas globales
            'users.bulk-delete',

            // Roles y Permisos
            'roles.index', 'roles.show', 'roles.create', 'roles.update', 'roles.delete',
            'permissions.index',

            // Negocios / Empresas (Gestión Multi-tenant)
            'businesses.index', 'businesses.show', 'businesses.create', 'businesses.update', 'businesses.delete',
        ]);

        // 2. Crear TODOS los Permisos en la BD
        // Extraemos valores únicos de la lista de superadmin (que contiene todos por el array_merge)
        $all_permissions = array_unique($superadmin_permissions);

        foreach ($all_permissions as $permission) {
            Permission::findOrCreate($permission, $guard);
        }

        // 3. Crear Roles Base
        $superadmin = Role::findOrCreate('superadmin', $guard);
        $owner      = Role::findOrCreate('owner', $guard);
        $cashier    = Role::findOrCreate('cashier', $guard);

        // 4. Asignar Permisos a Roles
        // Se usa syncPermissions en lugar de givePermissionTo para limpiar permisos antiguos si editas el seeder
        $cashier->syncPermissions($cashier_permissions);
        $owner->syncPermissions($owner_permissions);
        $superadmin->syncPermissions(Permission::all());
    }
}
