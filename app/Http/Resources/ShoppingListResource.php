<?php

namespace App\Http\Resources;

use App\Models\ShoppingList;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ShoppingList */
class ShoppingListResource extends JsonResource
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
            'week_start' => $this->week_start?->toDateString(),
            'items' => ShoppingListItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
