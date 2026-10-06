<?php

namespace App\Http\Resources;

use App\Models\ShoppingListItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ShoppingListItem */
class ShoppingListItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shopping_list_id' => $this->shopping_list_id,
            'ingredient_id' => $this->ingredient_id,
            'quantity' => $this->quantity,
            'unit' => $this->unit->value,
            'purchased_at' => $this->purchased_at?->toISOString(),
            'price' => $this->price,
            'source' => $this->source->value,
            'ingredient' => new IngredientResource($this->whenLoaded('ingredient')),
        ];
    }
}
