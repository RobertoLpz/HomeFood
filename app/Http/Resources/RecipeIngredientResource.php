<?php

namespace App\Http\Resources;

use App\Models\RecipeIngredient;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin RecipeIngredient */
class RecipeIngredientResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ingredient_id' => $this->ingredient_id,
            'quantity' => $this->quantity,
            'unit' => $this->unit->value,
            'is_optional' => $this->is_optional,
            'sort_order' => $this->sort_order,
            'ingredient' => new IngredientResource($this->whenLoaded('ingredient')),
        ];
    }
}
