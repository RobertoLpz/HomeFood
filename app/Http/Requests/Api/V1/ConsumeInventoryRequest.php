<?php

namespace App\Http\Requests\Api\V1;

use App\Enums\Unit;
use App\Models\InventoryItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConsumeInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $item = $this->route('inventoryItem');

        return $item instanceof InventoryItem && ($this->user()?->can('update', $item) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'quantity' => ['required', 'numeric', 'gt:0'],
            'unit' => ['required', Rule::enum(Unit::class)],
        ];
    }
}
