<?php

namespace Tests\Feature\Api;

use App\Enums\Difficulty;
use App\Enums\Dimension;
use App\Enums\ItemSource;
use App\Enums\Unit;
use App\Models\Ingredient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShoppingListGeneratorTest extends TestCase
{
    use RefreshDatabase;

    public function test_week_plan_aggregates_missing_ingredients_into_one_line(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('mobile')->plainTextToken;

        $householdId = $this->withToken($token)
            ->postJson('/api/v1/households', ['name' => 'Casa'])
            ->assertCreated()
            ->json('data.id');

        $headers = ['X-Household-Id' => $householdId];

        $eggs = Ingredient::factory()->system()->create([
            'name' => 'Huevo',
            'dimension' => Dimension::Count,
            'default_unit' => Unit::Piece,
        ]);
        $onion = Ingredient::factory()->system()->create([
            'name' => 'Cebolla',
            'dimension' => Dimension::Count,
            'default_unit' => Unit::Piece,
        ]);

        $this->withToken($token)->withHeaders($headers)->postJson('/api/v1/inventory', [
            'ingredient_id' => $eggs->id,
            'quantity' => 4,
            'unit' => Unit::Piece->value,
        ])->assertCreated();

        $this->withToken($token)->withHeaders($headers)->postJson('/api/v1/inventory', [
            'ingredient_id' => $onion->id,
            'quantity' => 2,
            'unit' => Unit::Piece->value,
        ])->assertCreated();

        $recipeId = $this->withToken($token)->withHeaders($headers)->postJson('/api/v1/recipes', [
            'name' => 'Huevos revueltos',
            'prep_minutes' => 10,
            'servings' => 2,
            'difficulty' => Difficulty::Easy->value,
            'instructions' => 'Batir y cocinar.',
            'ingredients' => [
                ['ingredient_id' => $eggs->id, 'quantity' => 6, 'unit' => Unit::Piece->value],
                ['ingredient_id' => $onion->id, 'quantity' => 1, 'unit' => Unit::Piece->value, 'is_optional' => false],
            ],
        ])->assertCreated()->json('data.id');

        $planId = $this->withToken($token)->withHeaders($headers)
            ->getJson('/api/v1/meal-plans?week=2026-10-05')
            ->assertOk()
            ->json('data.id');

        $this->withToken($token)->withHeaders($headers)->postJson("/api/v1/meal-plans/{$planId}/items", [
            'recipe_id' => $recipeId,
            'planned_on' => '2026-10-05',
            'meal_type' => 'breakfast',
            'servings' => 2,
        ])->assertCreated();

        $items = $this->plannedItems($token, $headers);
        $this->assertCount(1, $items);
        $this->assertSame($eggs->id, $items[0]['ingredient_id']);
        $this->assertSame('2.000', $items[0]['quantity']);

        $this->withToken($token)->withHeaders($headers)->postJson("/api/v1/meal-plans/{$planId}/items", [
            'recipe_id' => $recipeId,
            'planned_on' => '2026-10-06',
            'meal_type' => 'breakfast',
            'servings' => 2,
        ])->assertCreated();

        $items = $this->plannedItems($token, $headers);
        $this->assertCount(1, $items);
        $this->assertSame($eggs->id, $items[0]['ingredient_id']);
        $this->assertSame('8.000', $items[0]['quantity']);
        $this->assertSame(ItemSource::Planned->value, $items[0]['source']);
    }

    public function test_recompute_after_purchase_does_not_request_stocked_eggs_again(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('mobile')->plainTextToken;

        $householdId = $this->withToken($token)
            ->postJson('/api/v1/households', ['name' => 'Casa'])
            ->assertCreated()
            ->json('data.id');

        $headers = ['X-Household-Id' => $householdId];

        $eggs = Ingredient::factory()->system()->create([
            'name' => 'Huevo',
            'dimension' => Dimension::Count,
            'default_unit' => Unit::Piece,
        ]);

        $this->withToken($token)->withHeaders($headers)->postJson('/api/v1/inventory', [
            'ingredient_id' => $eggs->id,
            'quantity' => 4,
            'unit' => Unit::Piece->value,
        ])->assertCreated();

        $recipeId = $this->withToken($token)->withHeaders($headers)->postJson('/api/v1/recipes', [
            'name' => 'Huevos revueltos',
            'prep_minutes' => 10,
            'servings' => 2,
            'difficulty' => Difficulty::Easy->value,
            'instructions' => 'Batir y cocinar.',
            'ingredients' => [
                ['ingredient_id' => $eggs->id, 'quantity' => 6, 'unit' => Unit::Piece->value],
            ],
        ])->assertCreated()->json('data.id');

        $planId = $this->withToken($token)->withHeaders($headers)
            ->getJson('/api/v1/meal-plans?week=2026-10-05')
            ->assertOk()
            ->json('data.id');

        $this->withToken($token)->withHeaders($headers)->postJson("/api/v1/meal-plans/{$planId}/items", [
            'recipe_id' => $recipeId,
            'planned_on' => '2026-10-05',
            'meal_type' => 'breakfast',
            'servings' => 2,
        ])->assertCreated();

        $pending = collect($this->plannedItems($token, $headers))
            ->where('ingredient_id', $eggs->id)
            ->whereNull('purchased_at')
            ->values();
        $this->assertCount(1, $pending);
        $this->assertSame('2.000', $pending[0]['quantity']);

        $listId = $this->weekListId($token, $headers);

        $this->withToken($token)->withHeaders($headers)
            ->postJson("/api/v1/shopping-lists/{$listId}/items/{$pending[0]['id']}/purchase")
            ->assertOk();

        $stillNeeded = collect($this->plannedItems($token, $headers))
            ->where('ingredient_id', $eggs->id)
            ->whereNull('purchased_at');

        $this->assertCount(0, $stillNeeded);

        $stock = collect($this->withToken($token)->withHeaders($headers)
            ->getJson('/api/v1/inventory')
            ->assertOk()
            ->json('data'))
            ->firstWhere('ingredient_id', $eggs->id);

        $this->assertSame('6.000', $stock['quantity']);
    }

    /**
     * @param  array<string, int>  $headers
     * @return array<int, array<string, mixed>>
     */
    private function plannedItems(string $token, array $headers): array
    {
        $lists = $this->withToken($token)->withHeaders($headers)
            ->getJson('/api/v1/shopping-lists')
            ->assertOk()
            ->json('data');

        $week = collect($lists)->firstWhere('week_start', '2026-10-05');
        $this->assertNotNull($week);

        return collect($week['items'])
            ->where('source', ItemSource::Planned->value)
            ->values()
            ->all();
    }

    /**
     * @param  array<string, int>  $headers
     */
    private function weekListId(string $token, array $headers): int
    {
        $lists = $this->withToken($token)->withHeaders($headers)
            ->getJson('/api/v1/shopping-lists')
            ->assertOk()
            ->json('data');

        $week = collect($lists)->firstWhere('week_start', '2026-10-05');
        $this->assertNotNull($week);

        return (int) $week['id'];
    }
}
