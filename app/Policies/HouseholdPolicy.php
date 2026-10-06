<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Household;
use App\Models\User;
use App\Policies\Concerns\ChecksHouseholdMembership;

class HouseholdPolicy
{
    use ChecksHouseholdMembership;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Household $household): bool
    {
        return $this->belongsToHousehold($user, $household);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function addMember(User $user, Household $household): bool
    {
        return $user->households()
            ->whereKey($household->id)
            ->wherePivot('role', Role::Owner->value)
            ->exists();
    }
}
