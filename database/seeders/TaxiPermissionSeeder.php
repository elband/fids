<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Hak akses modul Taxi Information & Digital Signage.
 *
 * Setiap submenu punya permission sendiri sehingga role dapat diracik per
 * kebutuhan operator tanpa mengubah kode. Super Admin melewati pemeriksaan
 * lewat Gate::before di AppServiceProvider.
 */
class TaxiPermissionSeeder extends Seeder
{
    public const PERMISSIONS = [
        'taxi.view'                => 'Melihat modul Taxi Information',
        'taxi.directions.manage'   => 'Kelola petunjuk arah taksi',
        'taxi.counters.manage'     => 'Kelola counter taksi',
        'taxi.fares.manage'        => 'Kelola tarif taksi',
        'taxi.videos.manage'       => 'Kelola playlist video',
        'taxi.runningtext.manage'  => 'Kelola running text',
        'taxi.settings.manage'     => 'Kelola pengaturan display',
        'taxi.emergency.manage'    => 'Aktifkan emergency override',
        'taxi.screens.view'        => 'Monitoring layar signage',
    ];

    /** Preset permission per role; Super Admin tidak perlu didaftarkan. */
    public const ROLE_PRESETS = [
        'Admin FIDS' => [
            'taxi.view', 'taxi.directions.manage', 'taxi.counters.manage', 'taxi.fares.manage',
            'taxi.videos.manage', 'taxi.runningtext.manage', 'taxi.settings.manage',
            'taxi.emergency.manage', 'taxi.screens.view',
        ],
        'Admin Operasional' => [
            'taxi.view', 'taxi.directions.manage', 'taxi.counters.manage', 'taxi.fares.manage',
            'taxi.videos.manage', 'taxi.runningtext.manage', 'taxi.settings.manage',
            'taxi.emergency.manage', 'taxi.screens.view',
        ],
        'Operator Informasi' => [
            'taxi.view', 'taxi.counters.manage', 'taxi.fares.manage', 'taxi.runningtext.manage',
            'taxi.emergency.manage', 'taxi.screens.view',
        ],
    ];

    public function run(): void
    {
        foreach (array_keys(self::PERMISSIONS) as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);

        foreach (self::ROLE_PRESETS as $roleName => $permissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            // givePermissionTo bersifat menambah, jadi permission kustom yang
            // sudah diatur operator lewat UI tidak ikut terhapus saat seeder diulang.
            $role->givePermissionTo($permissions);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
