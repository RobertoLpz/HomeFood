<?php

namespace App\Actions\Households;

use App\Enums\Role;
use App\Models\Household;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CreateHousehold
{
    public function __invoke(User $user, string $name): Household
    {
        return DB::transaction(function () use ($user, $name): Household {
            $household = Household::query()->create(['name' => $name]);

            $household->users()->attach($user->id, ['role' => Role::Owner->value]);

            return $household->load(['users']);
        });
    }
}
