<?php

namespace App\Models;

use App\Enums\Unit;
use Database\Factories\PurchaseHistoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $household_id
 * @property int|null $shopping_list_id
 * @property int|null $shopping_list_item_id
 * @property int $ingredient_id
 * @property string $quantity
 * @property Unit $unit
 * @property string|null $price
 * @property string|null $store
 * @property Carbon $purchased_on
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'household_id',
    'shopping_list_id',
    'shopping_list_item_id',
    'ingredient_id',
    'quantity',
    'unit',
    'price',
    'store',
    'purchased_on',
])]
class PurchaseHistory extends Model
{
    /** @use HasFactory<PurchaseHistoryFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'unit' => Unit::class,
            'price' => 'decimal:2',
            'purchased_on' => 'date',
        ];
    }

    /**
     * @return BelongsTo<Household, $this>
     */
    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    /**
     * @return BelongsTo<ShoppingList, $this>
     */
    public function shoppingList(): BelongsTo
    {
        return $this->belongsTo(ShoppingList::class);
    }

    /**
     * @return BelongsTo<ShoppingListItem, $this>
     */
    public function shoppingListItem(): BelongsTo
    {
        return $this->belongsTo(ShoppingListItem::class);
    }

    /**
     * @return BelongsTo<Ingredient, $this>
     */
    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }
}
