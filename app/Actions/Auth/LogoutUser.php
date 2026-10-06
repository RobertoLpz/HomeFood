<?php

namespace App\Actions\Auth;

use App\Models\User;

class LogoutUser
{
    public function __invoke(User $user): void
    {
        $token = $user->currentAccessToken();

        if ($token !== null && method_exists($token, 'delete')) {
            $token->delete();
        }
    }
}
