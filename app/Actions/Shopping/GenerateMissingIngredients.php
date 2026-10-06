<?php

namespace App\Actions\Shopping;

use App\Models\Household;
use App\Services\Shopping\ShoppingListGenerator;
use Carbon\CarbonInterface;

class GenerateMissingIngredients
{
    public function __construct(private readonly ShoppingListGenerator $generator) {}

    public function __invoke(Household $household, CarbonInterface|string|null $week = null): void
    {
        if ($week === null) {
            $this->generator->recomputeOpenWeeks($household);

            return;
        }

        $this->generator->recompute($household, $week);
    }
}
