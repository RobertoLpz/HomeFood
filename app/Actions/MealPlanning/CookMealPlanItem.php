<?php

namespace App\Actions\MealPlanning;

use App\Actions\Shopping\GenerateMissingIngredients;
use App\Exceptions\InsufficientStockException;
use App\Models\Household;
use App\Models\MealPlanItem;
use App\Services\Inventory\InventoryService;
use App\Services\Units\UnitConverter;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CookMealPlanItem
{
    public function __construct(
        private readonly InventoryService $inventory,
        private readonly UnitConverter $units,
        private readonly GenerateMissingIngredients $generateMissingIngredients,
    ) {}

    public function __invoke(Household $household, MealPlanItem $item): MealPlanItem
    {
        $item->loadMissing('mealPlan', 'recipe.ingredients.ingredient');

        if ($item->cooked_at !== null) {
            throw ValidationException::withMessages([
                'cooked_at' => 'Esta comida ya se cocinó.',
            ]);
        }

        if ($item->recipe === null) {
            throw ValidationException::withMessages([
                'recipe_id' => 'La receta ya no está disponible.',
            ]);
        }

        $recipeServings = $this->units->compare($item->recipe->servings, '0') === 1
            ? $item->recipe->servings
            : '1.000';
        $factor = bcdiv($this->units->normalize($item->servings), $this->units->normalize($recipeServings), 6);

        $lines = [];

        foreach ($item->recipe->ingredients as $line) {
            if ($line->is_optional || $line->ingredient === null) {
                continue;
            }

            $lines[] = [
                'ingredient' => $line->ingredient,
                'quantity' => bcmul($this->units->normalize($line->quantity), $factor, 3),
                'unit' => $line->unit,
            ];
        }

        try {
            $this->inventory->deduct($household, $lines, recompute: false);
        } catch (InsufficientStockException $exception) {
            throw ValidationException::withMessages([
                'inventory' => $exception->getMessage(),
            ]);
        }

        DB::transaction(function () use ($item): void {
            $item->update(['cooked_at' => now()]);
        });

        ($this->generateMissingIngredients)($household, $item->mealPlan->week_start);

        return $item->refresh()->load('recipe.ingredients.ingredient');
    }
}
