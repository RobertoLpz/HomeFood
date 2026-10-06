<?php

namespace App\Policies;

use App\Models\Ingredient;
use App\Models\User;
use App\Policies\Concerns\ChecksHouseholdMembership;

class IngredientPolicy
{
    use ChecksHouseholdMembership;

    public function view(User $user, Ingredient $ingredient): bool
    {
        if ($ingredient->household_id === null) {
            return true;
        }

        return $this->belongsToHousehold($user, $ingredient->household_id);
    }

    public function create(User $user): bool
    {
        return true;
    }
}
