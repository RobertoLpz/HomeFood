<?php

namespace Database\Seeders;

use App\Enums\Dimension;
use App\Enums\Unit;
use App\Models\Ingredient;
use Illuminate\Database\Seeder;

class IngredientCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            ['Huevo', Dimension::Count, Unit::Piece],
            ['Leche', Dimension::Volume, Unit::Milliliter],
            ['Tomate', Dimension::Count, Unit::Piece],
            ['Cebolla', Dimension::Count, Unit::Piece],
            ['Pollo', Dimension::Mass, Unit::Gram],
            ['Arroz', Dimension::Mass, Unit::Gram],
            ['Tortilla', Dimension::Count, Unit::Piece],
            ['Queso', Dimension::Mass, Unit::Gram],
        ];

        foreach ($catalog as [$name, $dimension, $unit]) {
            Ingredient::query()->firstOrCreate(
                [
                    'household_id' => null,
                    'normalized_name' => Ingredient::normalize($name),
                ],
                [
                    'name' => $name,
                    'dimension' => $dimension,
                    'default_unit' => $unit,
                ],
            );
        }
    }
}
