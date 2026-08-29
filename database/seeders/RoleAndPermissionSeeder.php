<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Limpiar caché de permisos
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Crear Permisos Generales
        $cashier_permissions = [
            'products.view',
            'sales.create',
            'sales.view',
        ];

        $owner_permissions = [
            ...$cashier_permissions,
        ];

        foreach ( $owner_permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        // 2. Crear Roles Base
        $superadmin = Role::findOrCreate('superadmin', 'web');
        $owner      = Role::findOrCreate('owner', 'web');
        $cashier    = Role::findOrCreate('cashier', 'web');

        // 3. Asignar Permisos a Roles
        $superadmin->givePermissionTo(Permission::all());

        $cashier->givePermissionTo($cashier_permissions);

        $owner->givePermissionTo($owner_permissions);


    }
}
