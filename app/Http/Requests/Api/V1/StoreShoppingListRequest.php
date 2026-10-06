<?php

namespace App\Http\Requests\Api\V1;

use App\Models\ShoppingList;
use Illuminate\Foundation\Http\FormRequest;

class StoreShoppingListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', ShoppingList::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'week_start' => ['nullable', 'date'],
        ];
    }
}
