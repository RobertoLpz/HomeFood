<?php

namespace App\Policies;

use App\Models\MealPlanItem;
use App\Models\User;

class MealPlanItemPolicy
{
    public function update(User $user, MealPlanItem $mealPlanItem): bool
    {
        $mealPlanItem->loadMissing('mealPlan');

        return $user->can('update', $mealPlanItem->mealPlan);
    }

    public function delete(User $user, MealPlanItem $mealPlanItem): bool
    {
        return $this->update($user, $mealPlanItem);
    }
}
