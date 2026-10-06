<?php

namespace App\Models;

use App\Enums\Difficulty;
use App\Enums\RecipeSource;
use Database\Factories\RecipeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $household_id
 * @property string $name
 * @property string|null $description
 * @property string|null $image_path
 * @property int $prep_minutes
 * @property string $servings
 * @property Difficulty $difficulty
 * @property string $instructions
 * @property RecipeSource $source
 * @property Carbon|null $deleted_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Recipe extends Model
{
    /** @use HasFactory<RecipeFactory> */
    use HasFactory, SoftDeletes;

    /** @var list<string> */
    protected $fillable = [
        'household_id',
        'name',
        'description',
        'image_path',
        'prep_minutes',
        'servings',
        'difficulty',
        'instructions',
        'source',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'prep_minutes' => 'integer',
            'servings' => 'decimal:2',
            'difficulty' => Difficulty::class,
            'source' => RecipeSource::class,
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
    public function ingredients(): HasMany
    {
        return $this->hasMany(RecipeIngredient::class)->orderBy('sort_order');
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function favoritedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'recipe_favorites')->withPivot([]);
    }

    /**
     * @return HasMany<MealPlanItem, $this>
     */
    public function mealPlanItems(): HasMany
    {
        return $this->hasMany(MealPlanItem::class);
    }
}
