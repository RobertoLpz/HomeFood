<?php

namespace App\Policies;

use App\Models\ShoppingListItem;
use App\Models\User;

class ShoppingListItemPolicy
{
    public function update(User $user, ShoppingListItem $shoppingListItem): bool
    {
        $shoppingListItem->loadMissing('shoppingList');

        return $user->can('update', $shoppingListItem->shoppingList);
    }

    public function delete(User $user, ShoppingListItem $shoppingListItem): bool
    {
        return $this->update($user, $shoppingListItem);
    }
}
