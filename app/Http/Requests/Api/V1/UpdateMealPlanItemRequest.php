<?php

namespace App\Http\Requests\Api\V1;

use App\Enums\MealType;
use App\Models\MealPlanItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMealPlanItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        $item = $this->route('mealPlanItem');

        return $item instanceof MealPlanItem && ($this->user()?->can('update', $item) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'recipe_id' => ['sometimes', 'integer'],
            'planned_on' => ['sometimes', 'date'],
            'meal_type' => ['sometimes', Rule::enum(MealType::class)],
            'servings' => ['sometimes', 'numeric', 'gt:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
