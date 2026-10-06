<?php

namespace App\Http\Resources;

use App\Enums\Role;
use App\Models\Household;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Household */
class HouseholdResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'role' => $this->whenPivotLoaded('household_user', function (): ?string {
                $role = $this->pivot->role;

                return $role instanceof Role ? $role->value : $role;
            }),
            'members' => UserResource::collection($this->whenLoaded('users')),
        ];
    }
}
