<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\MealPlanning\CookMealPlanItem;
use App\Http\Controllers\Api\V1\Concerns\ResolvesHousehold;
use App\Http\Controllers\Controller;
use App\Http\Resources\MealPlanItemResource;
use App\Models\MealPlanItem;
use Illuminate\Http\Request;

class CookMealPlanItemController extends Controller
{
    use ResolvesHousehold;

    public function __invoke(Request $request, MealPlanItem $mealPlanItem, CookMealPlanItem $cookMealPlanItem): MealPlanItemResource
    {
        $this->authorize('update', $mealPlanItem);
        $mealPlanItem->loadMissing('mealPlan');
        abort_unless($mealPlanItem->mealPlan->household_id === $this->household($request)->id, 404);

        return new MealPlanItemResource($cookMealPlanItem($this->household($request), $mealPlanItem));
    }
}
