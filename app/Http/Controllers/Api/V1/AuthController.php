<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Auth\LoginUser;
use App\Actions\Auth\LogoutUser;
use App\Actions\Auth\RegisterUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function register(RegisterRequest $request, RegisterUser $registerUser): JsonResponse
    {
        $result = $registerUser($request->safe()->only(['name', 'email', 'password']));

        return (new UserResource($result['user']))
            ->additional(['token' => $result['token']])
            ->response()
            ->setStatusCode(201);
    }

    public function login(LoginRequest $request, LoginUser $loginUser): UserResource
    {
        $result = $loginUser($request->safe()->only(['email', 'password']));

        return (new UserResource($result['user']->load('households')))
            ->additional(['token' => $result['token']]);
    }

    public function logout(Request $request, LogoutUser $logoutUser): JsonResponse
    {
        $logoutUser($request->user());

        return response()->json(['message' => 'Sesión cerrada.']);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user()->load('households'));
    }
}
