<?php

namespace App\Models;

use App\Enums\ItemSource;
use App\Enums\Unit;
use Database\Factories\ShoppingListItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $shopping_list_id
 * @property int $ingredient_id
 * @property string $quantity
 * @property Unit $unit
 * @property Carbon|null $purchased_at
 * @property string|null $price
 * @property ItemSource $source
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class ShoppingListItem extends Model
{
    /** @use HasFactory<ShoppingListItemFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'shopping_list_id',
        'ingredient_id',
        'quantity',
        'unit',
        'purchased_at',
        'price',
        'source',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'unit' => Unit::class,
            'purchased_at' => 'datetime',
            'price' => 'decimal:2',
            'source' => ItemSource::class,
        ];
    }

    /**
     * @return BelongsTo<ShoppingList, $this>
     */
    public function shoppingList(): BelongsTo
    {
        return $this->belongsTo(ShoppingList::class);
    }

    /**
     * @return BelongsTo<Ingredient, $this>
     */
    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    /**
     * @return HasOne<PurchaseHistory, $this>
     */
    public function purchaseHistory(): HasOne
    {
        return $this->hasOne(PurchaseHistory::class);
    }
}
