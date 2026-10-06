<?php

namespace Database\Factories;

use App\Enums\ItemSource;
use App\Enums\Unit;
use App\Models\Ingredient;
use App\Models\ShoppingList;
use App\Models\ShoppingListItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ShoppingListItem>
 */
class ShoppingListItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'shopping_list_id' => ShoppingList::factory(),
            'ingredient_id' => Ingredient::factory(),
            'quantity' => 1,
            'unit' => Unit::Piece,
            'purchased_at' => null,
            'price' => null,
            'source' => ItemSource::Manual,
        ];
    }
}
