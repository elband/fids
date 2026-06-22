<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Audit M-07 — regresi untuk temuan keamanan C-01 & C-02.
 */
class SecurityRbacTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::create(['name' => 'Super Admin']);
        Role::create(['name' => 'Admin Operasional']);
    }

    private function verifiedUser(?string $role = null): User
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        if ($role) {
            $user->assignRole($role);
        }
        return $user;
    }

    /** C-01: registrasi publik harus nonaktif. */
    public function test_public_registration_is_disabled(): void
    {
        $this->get('/register')->assertNotFound();
        $this->post('/register', [])->assertNotFound();
    }

    /** Tamu diarahkan ke login. */
    public function test_guest_is_redirected_from_admin(): void
    {
        $this->get('/admin/dashboard')->assertRedirect('/login');
    }

    /** C-02: pengguna terautentikasi TANPA role ditolak (deny-by-default). */
    public function test_authenticated_user_without_role_is_forbidden(): void
    {
        $user = $this->verifiedUser();
        $this->actingAs($user)->get('/admin/flights')->assertForbidden();
    }

    /** Admin Operasional boleh mengakses modul operasional. */
    public function test_operational_admin_can_access_flights(): void
    {
        $user = $this->verifiedUser('Admin Operasional');
        $this->actingAs($user)->get('/admin/flights')->assertOk();
    }

    /** C-02: Admin Operasional TIDAK boleh mengelola user. */
    public function test_operational_admin_cannot_manage_users(): void
    {
        $user = $this->verifiedUser('Admin Operasional');
        $this->actingAs($user)->get('/admin/users')->assertForbidden();
    }

    /** Hanya Super Admin yang boleh mengelola user. */
    public function test_super_admin_can_manage_users(): void
    {
        $user = $this->verifiedUser('Super Admin');
        $this->actingAs($user)->get('/admin/users')->assertOk();
    }
}
