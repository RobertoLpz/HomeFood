<?php

namespace App\Services\Units;

use App\Enums\Dimension;
use App\Enums\Unit;
use App\Exceptions\IncompatibleUnitException;

class UnitConverter
{
    public function assertCompatible(Unit $unit, Dimension $dimension): void
    {
        if ($unit->dimension() !== $dimension) {
            throw IncompatibleUnitException::forIngredient();
        }
    }

    public function toBase(string|int|float $quantity, Unit $unit, Dimension $dimension): string
    {
        $this->assertCompatible($unit, $dimension);

        $multiplier = match ($unit) {
            Unit::Kilogram, Unit::Liter => '1000',
            default => '1',
        };

        return $this->mul($this->normalize($quantity), $multiplier);
    }

    public function fromBase(string|int|float $baseQuantity, Unit $unit, Dimension $dimension): string
    {
        $this->assertCompatible($unit, $dimension);

        $divisor = match ($unit) {
            Unit::Kilogram, Unit::Liter => '1000',
            default => '1',
        };

        return bcdiv($this->normalize($baseQuantity), $divisor, 3);
    }

    public function add(string|int|float $left, string|int|float $right): string
    {
        return bcadd($this->normalize($left), $this->normalize($right), 3);
    }

    public function sub(string|int|float $left, string|int|float $right): string
    {
        return bcsub($this->normalize($left), $this->normalize($right), 3);
    }

    public function mul(string|int|float $left, string|int|float $right): string
    {
        return bcmul($this->normalize($left), $this->normalize($right), 3);
    }

    public function compare(string|int|float $left, string|int|float $right): int
    {
        return bccomp($this->normalize($left), $this->normalize($right), 3);
    }

    public function normalize(string|int|float $quantity): string
    {
        return bcadd((string) $quantity, '0', 3);
    }
}
