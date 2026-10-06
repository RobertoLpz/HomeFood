<?php

namespace App\Services\Shopping;

use App\Enums\ItemSource;
use App\Models\Household;
use App\Models\Ingredient;
use App\Models\MealPlan;
use App\Models\ShoppingList;
use App\Models\ShoppingListItem;
use App\Services\Units\UnitConverter;
use App\Support\Week;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

class ShoppingListGenerator
{
    public function __construct(private readonly UnitConverter $units) {}

    public function recompute(Household $household, CarbonInterface|string $week): ShoppingList
    {
        return DB::transaction(function () use ($household, $week): ShoppingList {
            $start = Week::startingMonday($week);

            $plan = MealPlan::query()
                ->where('household_id', $household->id)
                ->whereDate('week_start', $start->toDateString())
                ->first();

            $needed = $this->neededBaseQuantities($plan);

            $list = ShoppingList::query()
                ->where('household_id', $household->id)
                ->whereDate('week_start', $start->toDateString())
                ->first();

            if ($list === null) {
                $list = ShoppingList::query()->create([
                    'household_id' => $household->id,
                    'name' => 'Semana '.$start->toDateString(),
                    'week_start' => $start->toDateString(),
                ]);
            }

            $inventory = $this->inventoryBaseQuantities($household);

            $missing = [];

            foreach ($needed as $ingredientId => $baseNeeded) {
                $gap = $this->units->sub($baseNeeded, $inventory[$ingredientId] ?? '0.000');

                if ($this->units->compare($gap, '0') === 1) {
                    $missing[$ingredientId] = $gap;
                }
            }

            $this->syncPlannedItems($list, $missing);

            return $list;
        });
    }

    public function recomputeOpenWeeks(Household $household): void
    {
        $weeks = MealPlan::query()
            ->where('household_id', $household->id)
            ->pluck('week_start')
            ->merge(
                ShoppingList::query()
                    ->where('household_id', $household->id)
                    ->whereNotNull('week_start')
                    ->pluck('week_start'),
            )
            ->map(fn (mixed $date): string => Week::startingMonday($date)->toDateString())
            ->unique()
            ->values();

        foreach ($weeks as $week) {
            $this->recompute($household, $week);
        }
    }

    /**
     * @return array<int, string>
     */
    private function neededBaseQuantities(?MealPlan $plan): array
    {
        if ($plan === null) {
            return [];
        }

        $items = $plan->items()
            ->whereNull('cooked_at')
            ->with(['recipe.ingredients.ingredient'])
            ->get();

        $totals = [];

        foreach ($items as $item) {
            $recipe = $item->recipe;

            if ($recipe === null) {
                continue;
            }

            $recipeServings = $this->units->compare($recipe->servings, '0') === 1
                ? $recipe->servings
                : '1.000';
            $factor = bcdiv($this->units->normalize($item->servings), $this->units->normalize($recipeServings), 6);

            foreach ($recipe->ingredients as $line) {
                if ($line->is_optional || $line->ingredient === null) {
                    continue;
                }

                $base = $this->units->toBase($line->quantity, $line->unit, $line->ingredient->dimension);
                $scaled = bcmul($base, $factor, 3);
                $totals[$line->ingredient_id] = $this->units->add($totals[$line->ingredient_id] ?? '0', $scaled);
            }
        }

        return $totals;
    }

    /**
     * @return array<int, string>
     */
    private function inventoryBaseQuantities(Household $household): array
    {
        $totals = [];

        $items = $household->inventoryItems()->with('ingredient')->get();

        foreach ($items as $item) {
            if ($item->ingredient === null) {
                continue;
            }

            $base = $this->units->toBase($item->quantity, $item->unit, $item->ingredient->dimension);
            $totals[$item->ingredient_id] = $this->units->add($totals[$item->ingredient_id] ?? '0', $base);
        }

        return $totals;
    }

    /**
     * @param  array<int, string>  $missingBase
     */
    private function syncPlannedItems(ShoppingList $list, array $missingBase): void
    {
        $ingredients = Ingredient::query()->whereKey(array_keys($missingBase))->get()->keyBy('id');

        $existing = $list->items()
            ->where('source', ItemSource::Planned->value)
            ->whereNull('purchased_at')
            ->get()
            ->keyBy('ingredient_id');

        foreach ($existing as $ingredientId => $item) {
            if (! isset($missingBase[$ingredientId], $ingredients[$ingredientId])) {
                $item->delete();

                continue;
            }

            $ingredient = $ingredients[$ingredientId];
            $item->update([
                'quantity' => $this->units->fromBase($missingBase[$ingredientId], $ingredient->default_unit, $ingredient->dimension),
                'unit' => $ingredient->default_unit,
            ]);
            unset($missingBase[$ingredientId]);
        }

        foreach ($missingBase as $ingredientId => $baseQuantity) {
            $ingredient = $ingredients->get($ingredientId);

            if ($ingredient === null) {
                continue;
            }

            ShoppingListItem::query()->create([
                'shopping_list_id' => $list->id,
                'ingredient_id' => $ingredient->id,
                'quantity' => $this->units->fromBase($baseQuantity, $ingredient->default_unit, $ingredient->dimension),
                'unit' => $ingredient->default_unit,
                'source' => ItemSource::Planned,
            ]);
        }
    }
}
