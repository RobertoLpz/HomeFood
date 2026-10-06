<?php

namespace App\Http\Requests\Api\V1;

use App\Enums\MealType;
use App\Models\MealPlan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMealPlanItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        $plan = $this->route('mealPlan');

        return $plan instanceof MealPlan && ($this->user()?->can('update', $plan) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'recipe_id' => ['required', 'integer'],
            'planned_on' => ['required', 'date'],
            'meal_type' => ['required', Rule::enum(MealType::class)],
            'servings' => ['required', 'numeric', 'gt:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
