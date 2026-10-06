<?php

namespace App\Http\Controllers\Api\V1\Concerns;

use App\Models\Household;
use App\Support\CurrentHousehold;
use Illuminate\Http\Request;

trait ResolvesHousehold
{
    protected function household(Request $request): Household
    {
        $household = $request->attributes->get('household');

        return $household instanceof Household ? $household : CurrentHousehold::resolve($request);
    }
}
