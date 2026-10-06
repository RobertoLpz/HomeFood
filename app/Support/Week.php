<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

class Week
{
    public static function startingMonday(CarbonInterface|string $date): CarbonImmutable
    {
        return CarbonImmutable::parse($date)->startOfDay()->startOfWeek(CarbonImmutable::MONDAY);
    }
}
