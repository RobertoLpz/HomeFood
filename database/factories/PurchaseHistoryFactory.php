<?php

namespace Database\Factories;

use App\Enums\Unit;
use App\Models\Household;
use App\Models\Ingredient;
use App\Models\PurchaseHistory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseHistory>
 */
class PurchaseHistoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'household_id' => Household::factory(),
            'shopping_list_id' => null,
            'shopping_list_item_id' => null,
            'ingredient_id' => Ingredient::factory(),
            'quantity' => 1,
            'unit' => Unit::Piece,
            'price' => null,
            'store' => null,
            'purchased_on' => now()->toDateString(),
        ];
    }
}
