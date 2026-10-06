<?php

namespace App\Http\Resources;

use App\Models\MealPlan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin MealPlan */
class MealPlanResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'household_id' => $this->household_id,
            'week_start' => $this->week_start->toDateString(),
            'items' => MealPlanItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
