<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminTestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@local.test'],
            [
                'name' => 'Admin Local',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
    }
}
