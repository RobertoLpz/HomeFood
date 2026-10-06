<?php

namespace App\Services\Recipes;

use App\Enums\RecipeSource;
use App\Enums\Unit;
use App\Models\Household;
use App\Models\Ingredient;
use App\Models\Recipe;
use App\Models\User;
use App\Services\Units\UnitConverter;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecipeService
{
    public function __construct(private readonly UnitConverter $units) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Household $household, array $data): Recipe
    {
        return DB::transaction(function () use ($household, $data): Recipe {
            $recipe = Recipe::query()->create([
                'household_id' => $household->id,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'image_path' => $data['image_path'] ?? null,
                'prep_minutes' => $data['prep_minutes'],
                'servings' => $data['servings'],
                'difficulty' => $data['difficulty'],
                'instructions' => $data['instructions'],
                'source' => $data['source'] ?? RecipeSource::Manual,
            ]);

            $this->syncIngredients($household, $recipe, $data['ingredients'] ?? []);

            return $recipe->load('ingredients.ingredient');
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Household $household, Recipe $recipe, array $data): Recipe
    {
        return DB::transaction(function () use ($household, $recipe, $data): Recipe {
            $recipe->update([
                'name' => $data['name'] ?? $recipe->name,
                'description' => array_key_exists('description', $data) ? $data['description'] : $recipe->description,
                'image_path' => array_key_exists('image_path', $data) ? $data['image_path'] : $recipe->image_path,
                'prep_minutes' => $data['prep_minutes'] ?? $recipe->prep_minutes,
                'servings' => $data['servings'] ?? $recipe->servings,
                'difficulty' => $data['difficulty'] ?? $recipe->difficulty,
                'instructions' => $data['instructions'] ?? $recipe->instructions,
                'source' => $data['source'] ?? $recipe->source,
            ]);

            if (array_key_exists('ingredients', $data)) {
                $recipe->ingredients()->delete();
                $this->syncIngredients($household, $recipe, $data['ingredients']);
            }

            return $recipe->refresh()->load('ingredients.ingredient');
        });
    }

    public function delete(Recipe $recipe): void
    {
        $recipe->delete();
    }

    public function favorite(User $user, Recipe $recipe): void
    {
        $recipe->favoritedBy()->syncWithoutDetaching([$user->id]);
    }

    public function unfavorite(User $user, Recipe $recipe): void
    {
        $recipe->favoritedBy()->detach($user->id);
    }

    /**
     * @param  array<int, array<string, mixed>>  $lines
     */
    private function syncIngredients(Household $household, Recipe $recipe, array $lines): void
    {
        foreach ($lines as $index => $line) {
            $ingredient = Ingredient::query()
                ->where(function ($query) use ($household): void {
                    $query->whereNull('household_id')->orWhere('household_id', $household->id);
                })
                ->find($line['ingredient_id']);

            if ($ingredient === null) {
                throw ValidationException::withMessages([
                    "ingredients.{$index}.ingredient_id" => 'El ingrediente no pertenece a este hogar.',
                ]);
            }

            $unit = $line['unit'] instanceof Unit ? $line['unit'] : Unit::from($line['unit']);
            $this->units->assertCompatible($unit, $ingredient->dimension);

            $recipe->ingredients()->create([
                'ingredient_id' => $ingredient->id,
                'quantity' => $line['quantity'],
                'unit' => $unit,
                'is_optional' => (bool) ($line['is_optional'] ?? false),
                'sort_order' => $line['sort_order'] ?? $index,
            ]);
        }
    }
}
