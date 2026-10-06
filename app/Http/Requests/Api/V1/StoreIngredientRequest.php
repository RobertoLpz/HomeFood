<?php

namespace App\Http\Requests\Api\V1;

use App\Enums\Dimension;
use App\Enums\Unit;
use App\Models\Ingredient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreIngredientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Ingredient::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'dimension' => ['required', Rule::enum(Dimension::class)],
            'default_unit' => ['required', Rule::enum(Unit::class)],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $unit = Unit::from($this->string('default_unit')->toString());
            $dimension = Dimension::from($this->string('dimension')->toString());

            if ($unit->dimension() !== $dimension) {
                $validator->errors()->add('default_unit', 'La unidad no corresponde a la dimensión del ingrediente.');
            }
        });
    }
}
