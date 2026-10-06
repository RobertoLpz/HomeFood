<?php

namespace App\Policies;

use App\Models\ShoppingList;
use App\Models\User;
use App\Policies\Concerns\ChecksHouseholdMembership;

class ShoppingListPolicy
{
    use ChecksHouseholdMembership;

    public function view(User $user, ShoppingList $shoppingList): bool
    {
        return $this->belongsToHousehold($user, $shoppingList->household_id);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, ShoppingList $shoppingList): bool
    {
        return $this->view($user, $shoppingList);
    }

    public function delete(User $user, ShoppingList $shoppingList): bool
    {
        return $this->view($user, $shoppingList);
    }
}
