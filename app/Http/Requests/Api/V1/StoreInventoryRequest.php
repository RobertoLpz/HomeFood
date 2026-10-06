<?php

namespace App\Http\Requests\Api\V1;

use App\Enums\Unit;
use App\Models\InventoryItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', InventoryItem::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'ingredient_id' => ['required', 'integer'],
            'quantity' => ['required', 'numeric', 'gte:0'],
            'unit' => ['required', Rule::enum(Unit::class)],
            'expires_on' => ['nullable', 'date'],
        ];
    }
}
