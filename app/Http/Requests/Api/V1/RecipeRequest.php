<?php

namespace App\Http\Requests\Api\V1;

use App\Enums\Difficulty;
use App\Enums\RecipeSource;
use App\Enums\Unit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecipeRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    protected function recipeRules(bool $partial): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image_path' => ['nullable', 'string', 'max:255'],
            'prep_minutes' => [$required, 'integer', 'min:0'],
            'servings' => [$required, 'numeric', 'gt:0'],
            'difficulty' => [$required, Rule::enum(Difficulty::class)],
            'instructions' => [$required, 'string'],
            'source' => ['sometimes', Rule::enum(RecipeSource::class)],
            'ingredients' => [$partial ? 'sometimes' : 'required', 'array'],
            'ingredients.*.ingredient_id' => ['required', 'integer'],
            'ingredients.*.quantity' => ['required', 'numeric', 'gt:0'],
            'ingredients.*.unit' => ['required', Rule::enum(Unit::class)],
            'ingredients.*.is_optional' => ['sometimes', 'boolean'],
            'ingredients.*.sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
