<?php

namespace Database\Factories;

use App\Enums\Unit;
use App\Models\Household;
use App\Models\Ingredient;
use App\Models\InventoryItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InventoryItem>
 */
class InventoryItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'household_id' => Household::factory(),
            'ingredient_id' => Ingredient::factory(),
            'quantity' => 1,
            'unit' => Unit::Piece,
            'expires_on' => null,
        ];
    }
}
