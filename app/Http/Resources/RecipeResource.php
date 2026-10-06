<?php

namespace App\Http\Resources;

use App\Models\Recipe;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Recipe */
class RecipeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'household_id' => $this->household_id,
            'name' => $this->name,
            'description' => $this->description,
            'image_path' => $this->image_path,
            'prep_minutes' => $this->prep_minutes,
            'servings' => $this->servings,
            'difficulty' => $this->difficulty->value,
            'instructions' => $this->instructions,
            'source' => $this->source->value,
            'is_favorite' => (bool) ($this->is_favorite ?? false),
            'ingredients' => RecipeIngredientResource::collection($this->whenLoaded('ingredients')),
        ];
    }
}
