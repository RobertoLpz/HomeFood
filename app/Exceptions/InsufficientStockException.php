<?php

namespace App\Exceptions;

use RuntimeException;

class InsufficientStockException extends RuntimeException
{
    public static function forIngredient(string $name): self
    {
        return new self("No hay suficiente {$name} en el inventario.");
    }
}
