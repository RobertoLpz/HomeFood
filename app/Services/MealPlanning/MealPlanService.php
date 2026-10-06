<?php

namespace App\Services\MealPlanning;

use App\Actions\Shopping\GenerateMissingIngredients;
use App\Models\Household;
use App\Models\MealPlan;
use App\Models\MealPlanItem;
use App\Models\Recipe;
use App\Support\Week;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MealPlanService
{
    public function __construct(private readonly GenerateMissingIngredients $generateMissingIngredients) {}

    public function ensureWeek(Household $household, CarbonInterface|string $date): MealPlan
    {
        $start = Week::startingMonday($date);

        $plan = MealPlan::query()
            ->where('household_id', $household->id)
            ->whereDate('week_start', $start->toDateString())
            ->first();

        if ($plan === null) {
            $plan = MealPlan::query()->create([
                'household_id' => $household->id,
                'week_start' => $start->toDateString(),
            ]);
        }

        return $plan->load(['items.recipe.ingredients.ingredient']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function addItem(Household $household, MealPlan $plan, array $data): MealPlanItem
    {
        $item = DB::transaction(function () use ($household, $plan, $data): MealPlanItem {
            $recipe = $this->recipeFor($household, (int) $data['recipe_id']);
            $this->assertDateInWeek($plan, (string) $data['planned_on']);

            return $plan->items()->create([
                'recipe_id' => $recipe->id,
                'planned_on' => $data['planned_on'],
                'meal_type' => $data['meal_type'],
                'servings' => $data['servings'],
                'notes' => $data['notes'] ?? null,
            ]);
        });

        ($this->generateMissingIngredients)($household, $plan->week_start);

        return $item->load('recipe.ingredients.ingredient');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateItem(Household $household, MealPlanItem $item, array $data): MealPlanItem
    {
        $item->loadMissing('mealPlan');

        $updated = DB::transaction(function () use ($household, $item, $data): MealPlanItem {
            $recipeId = isset($data['recipe_id'])
                ? $this->recipeFor($household, (int) $data['recipe_id'])->id
                : $item->recipe_id;

            $plannedOn = $data['planned_on'] ?? $item->planned_on->toDateString();
            $this->assertDateInWeek($item->mealPlan, (string) $plannedOn);

            $item->update([
                'recipe_id' => $recipeId,
                'planned_on' => $plannedOn,
                'meal_type' => $data['meal_type'] ?? $item->meal_type,
                'servings' => $data['servings'] ?? $item->servings,
                'notes' => array_key_exists('notes', $data) ? $data['notes'] : $item->notes,
            ]);

            return $item;
        });

        ($this->generateMissingIngredients)($household, $item->mealPlan->week_start);

        return $updated->refresh()->load('recipe.ingredients.ingredient');
    }

    public function removeItem(Household $household, MealPlanItem $item): void
    {
        $item->loadMissing('mealPlan');
        $week = $item->mealPlan->week_start;
        $item->delete();
        ($this->generateMissingIngredients)($household, $week);
    }

    private function recipeFor(Household $household, int $recipeId): Recipe
    {
        $recipe = Recipe::query()
            ->where('household_id', $household->id)
            ->find($recipeId);

        if ($recipe === null) {
            throw ValidationException::withMessages([
                'recipe_id' => 'La receta no pertenece a este hogar.',
            ]);
        }

        return $recipe;
    }

    private function assertDateInWeek(MealPlan $plan, string $date): void
    {
        $start = Week::startingMonday($plan->week_start);
        $parsed = CarbonImmutable::parse($date)->startOfDay();

        if ($parsed->lt($start) || $parsed->gt($start->addDays(6))) {
            throw ValidationException::withMessages([
                'planned_on' => 'La fecha queda fuera de la semana del plan.',
            ]);
        }
    }
}
