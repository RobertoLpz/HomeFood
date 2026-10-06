<?php

namespace App\Http\Requests\Api\V1;

use App\Models\Household;
use Illuminate\Foundation\Http\FormRequest;

class StoreHouseholdMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        $household = $this->route('household');

        return $household instanceof Household && ($this->user()?->can('addMember', $household) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
        ];
    }
}
