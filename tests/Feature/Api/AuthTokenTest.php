<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthTokenTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_login_me_and_logout_with_bearer_token(): void
    {
        $register = $this->postJson('/api/v1/auth/register', [
            'name' => 'Ana',
            'email' => 'ana@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $register->assertCreated();
        $register->assertJsonPath('data.email', 'ana@example.com');
        $token = $register->json('token');
        $this->assertNotEmpty($token);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'ana@example.com',
            'password' => 'wrong-password',
        ])->assertUnprocessable();

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'ana@example.com',
            'password' => 'password',
        ]);

        $login->assertOk();
        $loginToken = $login->json('token');

        $this->withToken($loginToken)
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'ana@example.com');

        $this->withToken($loginToken)
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        $this->assertNull(PersonalAccessToken::findToken($loginToken));

        $this->app['auth']->forgetGuards();

        $this->withToken($loginToken)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }

    public function test_domain_routes_reject_a_household_the_user_does_not_belong_to(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();

        $householdId = $this->withToken($owner->createToken('mobile')->plainTextToken)
            ->postJson('/api/v1/households', ['name' => 'Casa'])
            ->assertCreated()
            ->json('data.id');

        $this->app['auth']->forgetGuards();

        $this->withToken($stranger->createToken('mobile')->plainTextToken)
            ->getJson('/api/v1/ingredients', ['X-Household-Id' => $householdId])
            ->assertForbidden();
    }
}
