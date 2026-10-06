<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Unit;
use App\Http\Controllers\Api\V1\Concerns\ResolvesHousehold;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ConsumeInventoryRequest;
use App\Http\Requests\Api\V1\StoreInventoryRequest;
use App\Http\Requests\Api\V1\UpdateInventoryRequest;
use App\Http\Resources\InventoryItemResource;
use App\Models\InventoryItem;
use App\Services\Inventory\InventoryService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class InventoryController extends Controller
{
    use ResolvesHousehold;

    public function __construct(private readonly InventoryService $inventory) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $items = $this->household($request)->inventoryItems()->with('ingredient')->orderBy('id')->get();

        return InventoryItemResource::collection($items);
    }

    public function store(StoreInventoryRequest $request): JsonResponse
    {
        try {
            $item = $this->inventory->store($this->household($request), [
                'ingredient_id' => (int) $request->validated('ingredient_id'),
                'quantity' => $request->validated('quantity'),
                'unit' => Unit::from($request->validated('unit')),
                'expires_on' => $request->validated('expires_on'),
            ]);
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages([
                'ingredient_id' => 'Ese ingrediente ya está en el inventario.',
            ]);
        }

        return (new InventoryItemResource($item))->response()->setStatusCode(201);
    }

    public function update(UpdateInventoryRequest $request, InventoryItem $inventoryItem): InventoryItemResource
    {
        $this->assertHousehold($request, $inventoryItem);

        $data = $request->validated();

        if (isset($data['unit'])) {
            $data['unit'] = Unit::from($data['unit']);
        }

        return new InventoryItemResource($this->inventory->update($inventoryItem, $data));
    }

    public function destroy(Request $request, InventoryItem $inventoryItem): Response
    {
        $this->authorize('delete', $inventoryItem);
        $this->assertHousehold($request, $inventoryItem);
        $this->inventory->delete($inventoryItem);

        return response()->noContent();
    }

    public function consume(ConsumeInventoryRequest $request, InventoryItem $inventoryItem): InventoryItemResource
    {
        $this->assertHousehold($request, $inventoryItem);

        $item = $this->inventory->consume(
            $inventoryItem,
            $request->validated('quantity'),
            Unit::from($request->validated('unit')),
        );

        return new InventoryItemResource($item);
    }

    private function assertHousehold(Request $request, InventoryItem $inventoryItem): void
    {
        abort_unless($inventoryItem->household_id === $this->household($request)->id, 404);
    }
}
