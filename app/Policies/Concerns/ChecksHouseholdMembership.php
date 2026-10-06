<?php

namespace App\Policies\Concerns;

use App\Models\Household;
use App\Models\User;

trait ChecksHouseholdMembership
{
    protected function belongsToHousehold(User $user, Household|int $household): bool
    {
        $householdId = $household instanceof Household ? $household->id : $household;

        return $user->households()->whereKey($householdId)->exists();
    }
}
