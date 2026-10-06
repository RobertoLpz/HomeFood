<?php

namespace App\Http\Requests\Api\V1;

use App\Enums\ItemSource;
use App\Enums\Unit;
use App\Models\ShoppingList;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreShoppingListItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        $list = $this->route('shoppingList');

        return $list instanceof ShoppingList && ($this->user()?->can('update', $list) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'ingredient_id' => ['required', 'integer'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'unit' => ['required', Rule::enum(Unit::class)],
            'source' => ['sometimes', Rule::enum(ItemSource::class)],
        ];
    }
}
