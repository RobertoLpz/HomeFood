<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Shopping\MarkShoppingItemPurchased;
use App\Enums\ItemSource;
use App\Enums\Unit;
use App\Http\Controllers\Api\V1\Concerns\ResolvesHousehold;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\PurchaseShoppingListItemRequest;
use App\Http\Requests\Api\V1\StoreShoppingListItemRequest;
use App\Http\Requests\Api\V1\StoreShoppingListRequest;
use App\Http\Requests\Api\V1\UpdateShoppingListItemRequest;
use App\Http\Requests\Api\V1\UpdateShoppingListRequest;
use App\Http\Resources\ShoppingListItemResource;
use App\Http\Resources\ShoppingListResource;
use App\Models\Ingredient;
use App\Models\ShoppingList;
use App\Models\ShoppingListItem;
use App\Services\Units\UnitConverter;
use App\Support\Week;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class ShoppingListController extends Controller
{
    use ResolvesHousehold;

    public function __construct(private readonly UnitConverter $units) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $lists = $this->household($request)
            ->shoppingLists()
            ->with('items.ingredient')
            ->orderByDesc('week_start')
            ->orderBy('name')
            ->get();

        return ShoppingListResource::collection($lists);
    }

    public function store(StoreShoppingListRequest $request): ShoppingListResource
    {
        $household = $this->household($request);
        $week = $request->validated('week_start');

        $list = ShoppingList::query()->create([
            'household_id' => $household->id,
            'name' => $request->validated('name'),
            'week_start' => $week !== null ? Week::startingMonday($week)->toDateString() : null,
        ]);

        return new ShoppingListResource($list->load('items.ingredient'));
    }

    public function show(Request $request, ShoppingList $shoppingList): ShoppingListResource
    {
        $this->authorize('view', $shoppingList);
        $this->assertList($request, $shoppingList);

        return new ShoppingListResource($shoppingList->load('items.ingredient'));
    }

    public function update(UpdateShoppingListRequest $request, ShoppingList $shoppingList): ShoppingListResource
    {
        $this->assertList($request, $shoppingList);
        $data = $request->validated();

        if (array_key_exists('week_start', $data) && $data['week_start'] !== null) {
            $data['week_start'] = Week::startingMonday($data['week_start'])->toDateString();
        }

        $shoppingList->update($data);

        return new ShoppingListResource($shoppingList->refresh()->load('items.ingredient'));
    }

    public function destroy(Request $request, ShoppingList $shoppingList): Response
    {
        $this->authorize('delete', $shoppingList);
        $this->assertList($request, $shoppingList);
        $shoppingList->delete();

        return response()->noContent();
    }

    public function storeItem(StoreShoppingListItemRequest $request, ShoppingList $shoppingList): ShoppingListItemResource
    {
        $this->assertList($request, $shoppingList);
        $household = $this->household($request);
        $ingredient = $this->ingredientFor($household->id, (int) $request->validated('ingredient_id'));
        $unit = Unit::from($request->validated('unit'));
        $this->units->assertCompatible($unit, $ingredient->dimension);

        $item = $shoppingList->items()->create([
            'ingredient_id' => $ingredient->id,
            'quantity' => $request->validated('quantity'),
            'unit' => $unit,
            'source' => $request->validated('source', ItemSource::Manual->value),
        ]);

        return new ShoppingListItemResource($item->load('ingredient'));
    }

    public function updateItem(UpdateShoppingListItemRequest $request, ShoppingList $shoppingList, ShoppingListItem $shoppingListItem): ShoppingListItemResource
    {
        $this->assertItem($request, $shoppingList, $shoppingListItem);
        $shoppingListItem->loadMissing('ingredient');
        $data = $request->validated();

        if (isset($data['unit'])) {
            $unit = Unit::from($data['unit']);
            $this->units->assertCompatible($unit, $shoppingListItem->ingredient->dimension);
            $data['unit'] = $unit;
        }

        $shoppingListItem->update($data);

        return new ShoppingListItemResource($shoppingListItem->refresh()->load('ingredient'));
    }

    public function destroyItem(Request $request, ShoppingList $shoppingList, ShoppingListItem $shoppingListItem): Response
    {
        $this->authorize('delete', $shoppingListItem);
        $this->assertItem($request, $shoppingList, $shoppingListItem);
        $shoppingListItem->delete();

        return response()->noContent();
    }

    public function purchase(PurchaseShoppingListItemRequest $request, ShoppingList $shoppingList, ShoppingListItem $shoppingListItem, MarkShoppingItemPurchased $markShoppingItemPurchased): ShoppingListItemResource
    {
        $this->assertItem($request, $shoppingList, $shoppingListItem);

        $item = $markShoppingItemPurchased($this->household($request), $shoppingListItem, $request->validated());

        return new ShoppingListItemResource($item);
    }

    private function assertList(Request $request, ShoppingList $shoppingList): void
    {
        abort_unless($shoppingList->household_id === $this->household($request)->id, 404);
    }

    private function assertItem(Request $request, ShoppingList $shoppingList, ShoppingListItem $shoppingListItem): void
    {
        $this->assertList($request, $shoppingList);
        abort_unless($shoppingListItem->shopping_list_id === $shoppingList->id, 404);
    }

    private function ingredientFor(int $householdId, int $ingredientId): Ingredient
    {
        $ingredient = Ingredient::query()
            ->where(function ($query) use ($householdId): void {
                $query->whereNull('household_id')->orWhere('household_id', $householdId);
            })
            ->find($ingredientId);

        if ($ingredient === null) {
            throw ValidationException::withMessages([
                'ingredient_id' => 'El ingrediente no pertenece a este hogar.',
            ]);
        }

        return $ingredient;
    }
}
