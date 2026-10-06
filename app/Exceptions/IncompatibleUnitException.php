<?php

namespace App\Exceptions;

use InvalidArgumentException;

class IncompatibleUnitException extends InvalidArgumentException
{
    public static function forIngredient(): self
    {
        return new self('La unidad no corresponde a la dimensión del ingrediente.');
    }
}
