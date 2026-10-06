<?php

namespace App\Http\Resources;

use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin InventoryItem */
class InventoryItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'household_id' => $this->household_id,
            'ingredient_id' => $this->ingredient_id,
            'quantity' => $this->quantity,
            'unit' => $this->unit->value,
            'expires_on' => $this->expires_on?->toDateString(),
            'ingredient' => new IngredientResource($this->whenLoaded('ingredient')),
        ];
    }
}
