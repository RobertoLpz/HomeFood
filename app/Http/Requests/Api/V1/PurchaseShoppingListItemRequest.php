<?php

namespace App\Http\Requests\Api\V1;

use App\Models\ShoppingListItem;
use Illuminate\Foundation\Http\FormRequest;

class PurchaseShoppingListItemRequest extends FormRequest
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
            'price' => ['nullable', 'numeric', 'gte:0'],
            'store' => ['nullable', 'string', 'max:255'],
        ];
    }
}
