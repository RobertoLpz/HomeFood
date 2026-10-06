<?php

namespace App\Http\Middleware;

use App\Support\CurrentHousehold;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureHouseholdMembership
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set('household', CurrentHousehold::resolve($request));

        return $next($request);
    }
}
