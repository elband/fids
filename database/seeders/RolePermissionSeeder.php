<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Buat Roles
        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin']);
        $adminOps = Role::firstOrCreate(['name' => 'Admin Operasional']);
        $operator = Role::firstOrCreate(['name' => 'Operator FIDS']);
        $viewer = Role::firstOrCreate(['name' => 'Viewer']);

        // Buat User Super Admin
        $user = User::firstOrCreate(
            ['email' => 'admin@fids.local'],
            [
                'name' => 'Super Administrator',
                'password' => Hash::make('password'),
            ]
        );
        $user->assignRole($superAdmin);
    }
}
