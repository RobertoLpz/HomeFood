<?php

namespace App\Policies;

use App\Models\Recipe;
use App\Models\User;
use App\Policies\Concerns\ChecksHouseholdMembership;

class RecipePolicy
{
    use ChecksHouseholdMembership;

    public function view(User $user, Recipe $recipe): bool
    {
        return $this->belongsToHousehold($user, $recipe->household_id);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Recipe $recipe): bool
    {
        return $this->view($user, $recipe);
    }

    public function delete(User $user, Recipe $recipe): bool
    {
        return $this->view($user, $recipe);
    }
}
