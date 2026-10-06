<?php

namespace App\Support;

use App\Models\Household;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CurrentHousehold
{
    public static function resolve(Request $request): Household
    {
        $header = $request->header('X-Household-Id');

        if ($header === null || $header === '' || ! ctype_digit((string) $header)) {
            throw ValidationException::withMessages([
                'household' => 'El encabezado X-Household-Id es obligatorio.',
            ]);
        }

        /** @var User $user */
        $user = $request->user();

        $household = $user->households()->whereKey((int) $header)->first();

        if ($household === null) {
            abort(403, 'No perteneces a este hogar.');
        }

        return $household;
    }
}
