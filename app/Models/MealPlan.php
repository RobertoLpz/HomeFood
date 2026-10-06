<?php

namespace App\Models;

use Database\Factories\MealPlanFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $household_id
 * @property Carbon $week_start
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class MealPlan extends Model
{
    /** @use HasFactory<MealPlanFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = ['household_id', 'week_start'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'week_start' => 'date',
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
     * @return HasMany<MealPlanItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(MealPlanItem::class);
    }
}
