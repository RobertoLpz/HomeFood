<?php

namespace App\Services\Inventory;

use App\Actions\Shopping\GenerateMissingIngredients;
use App\Enums\Unit;
use App\Exceptions\InsufficientStockException;
use App\Models\Household;
use App\Models\Ingredient;
use App\Models\InventoryItem;
use App\Services\Units\UnitConverter;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    public function __construct(
        private readonly UnitConverter $units,
        private readonly GenerateMissingIngredients $generateMissingIngredients,
    ) {}

    /**
     * @param  array{ingredient_id: int, quantity: string|int|float, unit: Unit, expires_on?: string|null}  $data
     */
    public function store(Household $household, array $data): InventoryItem
    {
        $ingredient = $this->ingredientFor($household, $data['ingredient_id']);
        $this->units->assertCompatible($data['unit'], $ingredient->dimension);

        $item = InventoryItem::query()->create([
            'household_id' => $household->id,
            'ingredient_id' => $ingredient->id,
            'quantity' => $this->units->normalize($data['quantity']),
            'unit' => $data['unit'],
            'expires_on' => $data['expires_on'] ?? null,
        ]);

        ($this->generateMissingIngredients)($household);

        return $item->load('ingredient');
    }

    /**
     * @param  array{quantity?: string|int|float, unit?: Unit, expires_on?: string|null}  $data
     */
    public function update(InventoryItem $item, array $data): InventoryItem
    {
        $item->loadMissing('ingredient', 'household');
        $unit = $data['unit'] ?? $item->unit;
        $this->units->assertCompatible($unit, $item->ingredient->dimension);

        $item->update([
            'quantity' => array_key_exists('quantity', $data)
                ? $this->units->normalize($data['quantity'])
                : $item->quantity,
            'unit' => $unit,
            'expires_on' => array_key_exists('expires_on', $data) ? $data['expires_on'] : $item->expires_on,
        ]);

        ($this->generateMissingIngredients)($item->household);

        return $item->refresh()->load('ingredient');
    }

    public function delete(InventoryItem $item): void
    {
        $item->loadMissing('household');
        $household = $item->household;
        $item->delete();
        ($this->generateMissingIngredients)($household);
    }

    public function consume(InventoryItem $item, string|int|float $quantity, Unit $unit): InventoryItem
    {
        return DB::transaction(function () use ($item, $quantity, $unit): InventoryItem {
            $item->loadMissing('ingredient', 'household');
            $this->units->assertCompatible($unit, $item->ingredient->dimension);

            $available = $this->units->toBase($item->quantity, $item->unit, $item->ingredient->dimension);
            $requested = $this->units->toBase($quantity, $unit, $item->ingredient->dimension);

            if ($this->units->compare($available, $requested) === -1) {
                throw InsufficientStockException::forIngredient($item->ingredient->name);
            }

            $remaining = $this->units->sub($available, $requested);
            $item->update([
                'quantity' => $this->units->fromBase($remaining, $item->unit, $item->ingredient->dimension),
            ]);

            ($this->generateMissingIngredients)($item->household);

            return $item->refresh()->load('ingredient');
        });
    }

    public function add(Household $household, Ingredient $ingredient, string|int|float $quantity, Unit $unit, bool $recompute = true): InventoryItem
    {
        $this->units->assertCompatible($unit, $ingredient->dimension);

        $item = InventoryItem::query()->firstOrNew([
            'household_id' => $household->id,
            'ingredient_id' => $ingredient->id,
        ]);

        $incoming = $this->units->toBase($quantity, $unit, $ingredient->dimension);

        if ($item->exists) {
            $current = $this->units->toBase($item->quantity, $item->unit, $ingredient->dimension);
            $item->quantity = $this->units->fromBase($this->units->add($current, $incoming), $item->unit, $ingredient->dimension);
        } else {
            $item->quantity = $this->units->normalize($quantity);
            $item->unit = $unit;
        }

        $item->save();

        if ($recompute) {
            ($this->generateMissingIngredients)($household);
        }

        return $item->load('ingredient');
    }

    /**
     * @param  array<int, array{ingredient: Ingredient, quantity: string, unit: Unit}>  $lines
     */
    public function deduct(Household $household, array $lines, bool $recompute = true): void
    {
        DB::transaction(function () use ($household, $lines, $recompute): void {
            $items = InventoryItem::query()
                ->where('household_id', $household->id)
                ->whereIn('ingredient_id', collect($lines)->map(fn (array $line): int => $line['ingredient']->id)->all())
                ->lockForUpdate()
                ->get()
                ->keyBy('ingredient_id');

            $deltas = [];

            foreach ($lines as $line) {
                $ingredient = $line['ingredient'];
                $this->units->assertCompatible($line['unit'], $ingredient->dimension);
                $requested = $this->units->toBase($line['quantity'], $line['unit'], $ingredient->dimension);
                $deltas[$ingredient->id]['ingredient'] = $ingredient;
                $deltas[$ingredient->id]['base'] = $this->units->add($deltas[$ingredient->id]['base'] ?? '0', $requested);
            }

            foreach ($deltas as $ingredientId => $delta) {
                $item = $items->get($ingredientId);
                $available = $item === null
                    ? '0.000'
                    : $this->units->toBase($item->quantity, $item->unit, $delta['ingredient']->dimension);

                if ($this->units->compare($available, $delta['base']) === -1) {
                    throw InsufficientStockException::forIngredient($delta['ingredient']->name);
                }
            }

            foreach ($deltas as $ingredientId => $delta) {
                $item = $items->get($ingredientId);
                $available = $this->units->toBase($item->quantity, $item->unit, $delta['ingredient']->dimension);
                $item->update([
                    'quantity' => $this->units->fromBase(
                        $this->units->sub($available, $delta['base']),
                        $item->unit,
                        $delta['ingredient']->dimension,
                    ),
                ]);
            }

            if ($recompute) {
                ($this->generateMissingIngredients)($household);
            }
        });
    }

    private function ingredientFor(Household $household, int $ingredientId): Ingredient
    {
        return Ingredient::query()
            ->where(function ($query) use ($household): void {
                $query->whereNull('household_id')->orWhere('household_id', $household->id);
            })
            ->findOrFail($ingredientId);
    }
}
