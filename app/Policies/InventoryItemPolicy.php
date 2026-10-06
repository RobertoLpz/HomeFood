<?php

namespace App\Policies;

use App\Models\InventoryItem;
use App\Models\User;
use App\Policies\Concerns\ChecksHouseholdMembership;

class InventoryItemPolicy
{
    use ChecksHouseholdMembership;

    public function view(User $user, InventoryItem $inventoryItem): bool
    {
        return $this->belongsToHousehold($user, $inventoryItem->household_id);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, InventoryItem $inventoryItem): bool
    {
        return $this->view($user, $inventoryItem);
    }

    public function delete(User $user, InventoryItem $inventoryItem): bool
    {
        return $this->view($user, $inventoryItem);
    }
}
