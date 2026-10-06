<?php

namespace App\Enums;

enum Unit: string
{
    case Piece = 'piece';
    case Gram = 'g';
    case Kilogram = 'kg';
    case Milliliter = 'ml';
    case Liter = 'l';

    public function dimension(): Dimension
    {
        return match ($this) {
            self::Piece => Dimension::Count,
            self::Gram, self::Kilogram => Dimension::Mass,
            self::Milliliter, self::Liter => Dimension::Volume,
        };
    }

    public function isBase(): bool
    {
        return match ($this) {
            self::Piece, self::Gram, self::Milliliter => true,
            self::Kilogram, self::Liter => false,
        };
    }
}
