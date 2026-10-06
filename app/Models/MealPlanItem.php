<?php

namespace App\Models;

use App\Enums\MealType;
use Database\Factories\MealPlanItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $meal_plan_id
 * @property int $recipe_id
 * @property Carbon $planned_on
 * @property MealType $meal_type
 * @property string $servings
 * @property string|null $notes
 * @property Carbon|null $cooked_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['meal_plan_id', 'recipe_id', 'planned_on', 'meal_type', 'servings', 'notes', 'cooked_at'])]
class MealPlanItem extends Model
{
    /** @use HasFactory<MealPlanItemFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'planned_on' => 'date',
            'meal_type' => MealType::class,
            'servings' => 'decimal:2',
            'cooked_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<MealPlan, $this>
     */
    public function mealPlan(): BelongsTo
    {
        return $this->belongsTo(MealPlan::class);
    }

    /**
     * @return BelongsTo<Recipe, $this>
     */
    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }
}
