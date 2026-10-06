<?php

namespace App\Http\Requests\Api\V1;

use App\Models\Recipe;

class UpdateRecipeRequest extends RecipeRequest
{
    public function authorize(): bool
    {
        $recipe = $this->route('recipe');

        return $recipe instanceof Recipe && ($this->user()?->can('update', $recipe) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->recipeRules(partial: true);
    }
}
