<?php

namespace App\Http\Resources;

use App\Models\MealPlanItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin MealPlanItem */
class MealPlanItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'meal_plan_id' => $this->meal_plan_id,
            'recipe_id' => $this->recipe_id,
            'planned_on' => $this->planned_on->toDateString(),
            'meal_type' => $this->meal_type->value,
            'servings' => $this->servings,
            'notes' => $this->notes,
            'cooked_at' => $this->cooked_at?->toISOString(),
            'recipe' => new RecipeResource($this->whenLoaded('recipe')),
        ];
    }
}
