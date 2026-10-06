<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Dimension;
use App\Enums\Unit;
use App\Http\Controllers\Api\V1\Concerns\ResolvesHousehold;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreIngredientRequest;
use App\Http\Resources\IngredientResource;
use App\Models\Ingredient;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class IngredientController extends Controller
{
    use ResolvesHousehold;

    public function index(Request $request): AnonymousResourceCollection
    {
        $household = $this->household($request);

        $ingredients = Ingredient::query()
            ->where(function ($query) use ($household): void {
                $query->whereNull('household_id')->orWhere('household_id', $household->id);
            })
            ->orderBy('name')
            ->get();

        return IngredientResource::collection($ingredients);
    }

    public function store(StoreIngredientRequest $request): IngredientResource
    {
        $household = $this->household($request);

        try {
            $ingredient = Ingredient::query()->create([
                'household_id' => $household->id,
                'name' => $request->validated('name'),
                'dimension' => Dimension::from($request->validated('dimension')),
                'default_unit' => Unit::from($request->validated('default_unit')),
            ]);
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages([
                'name' => 'Ya existe un ingrediente con ese nombre.',
            ]);
        }

        return new IngredientResource($ingredient);
    }
}
