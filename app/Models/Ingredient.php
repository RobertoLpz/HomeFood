<?php

namespace App\Models;

use App\Enums\Dimension;
use App\Enums\Unit;
use Database\Factories\IngredientFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $household_id
 * @property string $name
 * @property string $normalized_name
 * @property Dimension $dimension
 * @property Unit $default_unit
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Ingredient extends Model
{
    /** @use HasFactory<IngredientFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = ['household_id', 'name', 'normalized_name', 'dimension', 'default_unit'];

    protected static function booted(): void
    {
        static::saving(function (Ingredient $ingredient): void {
            $ingredient->normalized_name = self::normalize($ingredient->name);
            $ingredient->household_scope = $ingredient->household_id ?? 0;
        });
    }

    public static function normalize(string $name): string
    {
        $normalized = mb_strtolower(trim($name));
        $collapsed = preg_replace('/\s+/u', ' ', $normalized);

        return $collapsed ?? $normalized;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'dimension' => Dimension::class,
            'default_unit' => Unit::class,
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
     * @return HasMany<RecipeIngredient, $this>
     */
    public function recipeIngredients(): HasMany
    {
        return $this->hasMany(RecipeIngredient::class);
    }

    /**
     * @return HasMany<InventoryItem, $this>
     */
    public function inventoryItems(): HasMany
    {
        return $this->hasMany(InventoryItem::class);
    }

    /**
     * @return HasMany<ShoppingListItem, $this>
     */
    public function shoppingListItems(): HasMany
    {
        return $this->hasMany(ShoppingListItem::class);
    }
}
