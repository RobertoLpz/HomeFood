<?php

namespace App\Http\Requests\Api\V1;

use App\Models\Recipe;

class StoreRecipeRequest extends RecipeRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Recipe::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->recipeRules(partial: false);
    }
}
