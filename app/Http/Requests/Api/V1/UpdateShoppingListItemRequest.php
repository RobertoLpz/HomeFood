<?php

namespace App\Http\Requests\Api\V1;

use App\Enums\Unit;
use App\Models\ShoppingListItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateShoppingListItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        $item = $this->route('shoppingListItem');

        return $item instanceof ShoppingListItem && ($this->user()?->can('update', $item) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'quantity' => ['sometimes', 'numeric', 'gt:0'],
            'unit' => ['sometimes', Rule::enum(Unit::class)],
        ];
    }
}
