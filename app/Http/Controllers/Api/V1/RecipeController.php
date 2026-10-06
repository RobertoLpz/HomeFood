<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesHousehold;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreRecipeRequest;
use App\Http\Requests\Api\V1\UpdateRecipeRequest;
use App\Http\Resources\RecipeResource;
use App\Models\Recipe;
use App\Services\Recipes\RecipeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class RecipeController extends Controller
{
    use ResolvesHousehold;

    public function __construct(private readonly RecipeService $recipes) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $household = $this->household($request);

        $recipes = Recipe::query()
            ->where('household_id', $household->id)
            ->with('ingredients.ingredient')
            ->withExists([
                'favoritedBy as is_favorite' => fn ($query) => $query->where('user_id', $request->user()->id),
            ])
            ->orderBy('name')
            ->get();

        return RecipeResource::collection($recipes);
    }

    public function store(StoreRecipeRequest $request): JsonResponse
    {
        $recipe = $this->recipes->create($this->household($request), $request->validated());
        $recipe->setAttribute('is_favorite', false);

        return (new RecipeResource($recipe))->response()->setStatusCode(201);
    }

    public function show(Request $request, Recipe $recipe): RecipeResource
    {
        $this->authorize('view', $recipe);
        $this->assertHousehold($request, $recipe);

        $recipe->load('ingredients.ingredient');
        $recipe->setAttribute('is_favorite', $recipe->favoritedBy()->whereKey($request->user()->id)->exists());

        return new RecipeResource($recipe);
    }

    public function update(UpdateRecipeRequest $request, Recipe $recipe): RecipeResource
    {
        $this->assertHousehold($request, $recipe);
        $updated = $this->recipes->update($this->household($request), $recipe, $request->validated());
        $updated->setAttribute('is_favorite', $updated->favoritedBy()->whereKey($request->user()->id)->exists());

        return new RecipeResource($updated);
    }

    public function destroy(Request $request, Recipe $recipe): Response
    {
        $this->authorize('delete', $recipe);
        $this->assertHousehold($request, $recipe);
        $this->recipes->delete($recipe);

        return response()->noContent();
    }

    public function favorite(Request $request, Recipe $recipe): RecipeResource
    {
        $this->authorize('view', $recipe);
        $this->assertHousehold($request, $recipe);
        $this->recipes->favorite($request->user(), $recipe);
        $recipe->load('ingredients.ingredient');
        $recipe->setAttribute('is_favorite', true);

        return new RecipeResource($recipe);
    }

    public function unfavorite(Request $request, Recipe $recipe): RecipeResource
    {
        $this->authorize('view', $recipe);
        $this->assertHousehold($request, $recipe);
        $this->recipes->unfavorite($request->user(), $recipe);
        $recipe->load('ingredients.ingredient');
        $recipe->setAttribute('is_favorite', false);

        return new RecipeResource($recipe);
    }

    private function assertHousehold(Request $request, Recipe $recipe): void
    {
        abort_unless($recipe->household_id === $this->household($request)->id, 404);
    }
}
