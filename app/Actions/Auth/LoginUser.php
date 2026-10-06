<?php

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginUser
{
    /**
     * @param  array{email: string, password: string}  $data
     * @return array{user: User, token: string}
     */
    public function __invoke(array $data): array
    {
        $user = User::query()->where('email', $data['email'])->first();

        if ($user === null || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        return [
            'user' => $user,
            'token' => $user->createToken('mobile')->plainTextToken,
        ];
    }
}
