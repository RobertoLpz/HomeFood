<?php

namespace App\Policies;

use App\Models\MealPlan;
use App\Models\User;
use App\Policies\Concerns\ChecksHouseholdMembership;

class MealPlanPolicy
{
    use ChecksHouseholdMembership;

    public function view(User $user, MealPlan $mealPlan): bool
    {
        return $this->belongsToHousehold($user, $mealPlan->household_id);
    }

    public function update(User $user, MealPlan $mealPlan): bool
    {
        return $this->view($user, $mealPlan);
    }
}
