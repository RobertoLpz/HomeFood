<?php

namespace Database\Factories;

use App\Enums\Difficulty;
use App\Enums\RecipeSource;
use App\Models\Household;
use App\Models\Recipe;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Recipe>
 */
class RecipeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'household_id' => Household::factory(),
            'name' => fake()->sentence(3),
            'description' => fake()->optional()->sentence(),
            'image_path' => null,
            'prep_minutes' => fake()->numberBetween(5, 60),
            'servings' => 2,
            'difficulty' => Difficulty::Easy,
            'instructions' => fake()->paragraph(),
            'source' => RecipeSource::Manual,
        ];
    }
}
