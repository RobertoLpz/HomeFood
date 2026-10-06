<?php

namespace App\Http\Resources;

use App\Models\PurchaseHistory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin PurchaseHistory */
class PurchaseHistoryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'household_id' => $this->household_id,
            'shopping_list_id' => $this->shopping_list_id,
            'shopping_list_item_id' => $this->shopping_list_item_id,
            'ingredient_id' => $this->ingredient_id,
            'quantity' => $this->quantity,
            'unit' => $this->unit->value,
            'price' => $this->price,
            'store' => $this->store,
            'purchased_on' => $this->purchased_on->toDateString(),
        ];
    }
}
