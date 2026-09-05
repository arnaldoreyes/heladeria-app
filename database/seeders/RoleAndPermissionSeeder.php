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

        // 1. Limpiar caché de permisos
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // =========================================================================
        // 2. Definir Permisos por Nivel de Acceso
        // =========================================================================
        
        // --- CAJERO (CASHIER) ---
        // Acceso básico de lectura y operaciones diarias
        $cashier_permissions = [
            // Catálogo (Lectura)
            'products.index', 'products.show',
            'categories.index', 'categories.show',
            
            // Ventas (Lectura y Creación)
            'sales.index', 'sales.show', 'sales.create',
            
            // Clientes (Gestión básica)
            'customers.index', 'customers.show', 'customers.create', 'customers.update',
        ];

        // --- DUEÑO (OWNER) ---
        // Hereda de cajero + Gestión total del negocio local
        $owner_permissions = array_merge($cashier_permissions, [
            // Catálogo (Destructivo y Creación)
            'products.create', 'products.update', 'products.delete', 'products.bulk-delete',
            'categories.create', 'categories.update', 'categories.delete', 'categories.bulk-delete',
            
            // Ventas y Clientes (Destructivo)
            'sales.update', 'sales.delete',
            'customers.delete', 'customers.bulk-delete',
            
            // Inventario y Compras (Agregado desde api.php)
            'inventory.index', 'inventory.show',
            'restocks.index', 'restocks.show', 'restocks.create', 'restocks.update', 'restocks.delete',
            
            // Finanzas y Pagos (Agregado desde api.php)
            'expenses.index', 'expenses.show', 'expenses.create', 'expenses.update', 'expenses.delete',
            'payment-types.index', 'payment-types.show', 'payment-types.create', 'payment-types.update', 'payment-types.delete',
            'payment-methods.index', 'payment-methods.show', 'payment-methods.create', 'payment-methods.update', 'payment-methods.delete', 'payment-methods.bulk-delete',
            'exchange-rates.index', 'exchange-rates.show', 'exchange-rates.create', 'exchange-rates.update', 'exchange-rates.delete',
            
            // Configuración y Análisis
            'settings.index', 'settings.update',
            'analytics.index',
            
            // Usuarios / Empleados
            'users.index', 'users.show', 'users.create', 'users.update', 'users.delete', 'users.bulk-delete',
        ]);

        // --- SUPERADMIN ---
        // Hereda de dueño + Gestión global multi-tenant
        $superadmin_permissions = array_merge($owner_permissions, [
            // Negocios / Empresas
            'businesses.index', 'businesses.show', 'businesses.create', 'businesses.update', 'businesses.delete', 'businesses.bulk-delete',
            
            // Seguridad (Roles y Permisos)
            'roles.index', 'roles.show', 'roles.create', 'roles.update', 'roles.delete',
            'permissions.index',
        ]);

        // =========================================================================
        // 3. Crear Permisos en la Base de Datos
        // =========================================================================
        $all_permissions = array_unique($superadmin_permissions);

        foreach ($all_permissions as $permission) {
            Permission::findOrCreate($permission, $guard);
        }

        // =========================================================================
        // 4. Crear Roles Base
        // =========================================================================
        $superadmin = Role::findOrCreate('superadmin', $guard);
        $owner      = Role::findOrCreate('owner', $guard);
        $cashier    = Role::findOrCreate('cashier', $guard);

        // =========================================================================
        // 5. Asignar Permisos a los Roles
        // =========================================================================
        // syncPermissions elimina los permisos que ya no existan en el array
        $cashier->syncPermissions($cashier_permissions);
        $owner->syncPermissions($owner_permissions);
        $superadmin->syncPermissions(Permission::all());
    }
}