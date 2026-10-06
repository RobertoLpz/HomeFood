<?php

namespace Database\Factories;

use App\Enums\Dimension;
use App\Enums\Unit;
use App\Models\Household;
use App\Models\Ingredient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ingredient>
 */
class IngredientFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->word();

        return [
            'household_id' => Household::factory(),
            'name' => $name,
            'normalized_name' => Ingredient::normalize($name),
            'dimension' => Dimension::Count,
            'default_unit' => Unit::Piece,
        ];
    }

    public function system(): static
    {
        return $this->state(fn (): array => [
            'household_id' => null,
        ]);
    }
}
