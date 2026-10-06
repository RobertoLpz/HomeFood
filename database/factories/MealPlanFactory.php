<?php

namespace Database\Factories;

use App\Models\Household;
use App\Models\MealPlan;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MealPlan>
 */
class MealPlanFactory extends Factory
{
    public function definition(): array
    {
        return [
            'household_id' => Household::factory(),
            'week_start' => now()->startOfWeek(CarbonImmutable::MONDAY)->toDateString(),
        ];
    }
}
