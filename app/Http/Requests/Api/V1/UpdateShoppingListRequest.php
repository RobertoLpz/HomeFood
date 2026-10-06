<?php

namespace App\Http\Requests\Api\V1;

use App\Models\ShoppingList;
use Illuminate\Foundation\Http\FormRequest;

class UpdateShoppingListRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:255'],
            'week_start' => ['nullable', 'date'],
        ];
    }
}
