<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesHousehold;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreMealPlanItemRequest;
use App\Http\Requests\Api\V1\UpdateMealPlanItemRequest;
use App\Http\Resources\MealPlanItemResource;
use App\Http\Resources\MealPlanResource;
use App\Models\MealPlan;
use App\Models\MealPlanItem;
use App\Services\MealPlanning\MealPlanService;
use App\Support\Week;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class MealPlanController extends Controller
{
    use ResolvesHousehold;

    public function __construct(private readonly MealPlanService $mealPlans) {}

    public function show(Request $request): MealPlanResource
    {
        $request->validate([
            'week' => ['required', 'date'],
        ]);

        $plan = $this->mealPlans->ensureWeek(
            $this->household($request),
            Week::startingMonday($request->string('week')->toString()),
        );

        return new MealPlanResource($plan->fresh(['items.recipe.ingredients.ingredient']));
    }

    public function storeItem(StoreMealPlanItemRequest $request, MealPlan $mealPlan): JsonResponse
    {
        abort_unless($mealPlan->household_id === $this->household($request)->id, 404);

        try {
            $item = $this->mealPlans->addItem($this->household($request), $mealPlan, $request->validated());
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages([
                'meal_type' => 'Ya hay una comida en esa franja.',
            ]);
        }

        return (new MealPlanItemResource($item))->response()->setStatusCode(201);
    }

    public function updateItem(UpdateMealPlanItemRequest $request, MealPlanItem $mealPlanItem): MealPlanItemResource
    {
        $mealPlanItem->loadMissing('mealPlan');
        abort_unless($mealPlanItem->mealPlan->household_id === $this->household($request)->id, 404);

        try {
            $item = $this->mealPlans->updateItem($this->household($request), $mealPlanItem, $request->validated());
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages([
                'meal_type' => 'Ya hay una comida en esa franja.',
            ]);
        }

        return new MealPlanItemResource($item);
    }

    public function destroyItem(Request $request, MealPlanItem $mealPlanItem): Response
    {
        $this->authorize('delete', $mealPlanItem);
        $mealPlanItem->loadMissing('mealPlan');
        abort_unless($mealPlanItem->mealPlan->household_id === $this->household($request)->id, 404);
        $this->mealPlans->removeItem($this->household($request), $mealPlanItem);

        return response()->noContent();
    }
}
