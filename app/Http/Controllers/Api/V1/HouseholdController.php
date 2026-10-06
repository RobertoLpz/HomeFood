<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Households\AddHouseholdMember;
use App\Actions\Households\CreateHousehold;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreHouseholdMemberRequest;
use App\Http\Requests\Api\V1\StoreHouseholdRequest;
use App\Http\Resources\HouseholdResource;
use App\Http\Resources\UserResource;
use App\Models\Household;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HouseholdController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return HouseholdResource::collection(
            $request->user()->households()->orderBy('name')->get(),
        );
    }

    public function store(StoreHouseholdRequest $request, CreateHousehold $createHousehold): JsonResponse
    {
        $household = $createHousehold($request->user(), $request->validated('name'));

        return (new HouseholdResource($household))->response()->setStatusCode(201);
    }

    public function show(Request $request, Household $household): HouseholdResource
    {
        $this->authorize('view', $household);

        return new HouseholdResource($household->load('users'));
    }

    public function storeMember(StoreHouseholdMemberRequest $request, Household $household, AddHouseholdMember $addHouseholdMember): UserResource
    {
        $member = $addHouseholdMember($household, $request->validated('email'));

        return new UserResource($member);
    }
}
