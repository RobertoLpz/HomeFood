<?php

namespace App\Actions\Shopping;

use App\Models\Household;
use App\Models\PurchaseHistory;
use App\Models\ShoppingListItem;
use App\Services\Inventory\InventoryService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MarkShoppingItemPurchased
{
    public function __construct(
        private readonly InventoryService $inventory,
        private readonly GenerateMissingIngredients $generateMissingIngredients,
    ) {}

    /**
     * @param  array{price?: string|int|float|null, store?: string|null}  $data
     */
    public function __invoke(Household $household, ShoppingListItem $item, array $data = []): ShoppingListItem
    {
        if ($item->purchased_at !== null) {
            throw ValidationException::withMessages([
                'purchased_at' => 'Este artículo ya fue comprado.',
            ]);
        }

        $item->loadMissing('ingredient', 'shoppingList');

        DB::transaction(function () use ($household, $item, $data): void {
            $item->update([
                'purchased_at' => now(),
                'price' => $data['price'] ?? null,
            ]);

            $this->inventory->add(
                $household,
                $item->ingredient,
                $item->quantity,
                $item->unit,
                recompute: false,
            );

            PurchaseHistory::query()->create([
                'household_id' => $household->id,
                'shopping_list_id' => $item->shopping_list_id,
                'shopping_list_item_id' => $item->id,
                'ingredient_id' => $item->ingredient_id,
                'quantity' => $item->quantity,
                'unit' => $item->unit,
                'price' => $data['price'] ?? null,
                'store' => $data['store'] ?? null,
                'purchased_on' => now()->toDateString(),
            ]);
        });

        if ($item->shoppingList->week_start !== null) {
            ($this->generateMissingIngredients)($household, $item->shoppingList->week_start);
        }

        return $item->refresh()->load('ingredient');
    }
}
