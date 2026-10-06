<?php

namespace App\Actions\Households;

use App\Enums\Role;
use App\Models\Household;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class AddHouseholdMember
{
    public function __invoke(Household $household, string $email): User
    {
        $member = User::query()->where('email', $email)->first();

        if ($member === null) {
            throw ValidationException::withMessages([
                'email' => 'No hay un usuario registrado con ese correo.',
            ]);
        }

        if ($household->users()->whereKey($member->id)->exists()) {
            throw ValidationException::withMessages([
                'email' => 'Esa persona ya pertenece al hogar.',
            ]);
        }

        $household->users()->attach($member->id, ['role' => Role::Member->value]);

        return $member;
    }
}
