<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CookMealPlanItemController;
use App\Http\Controllers\Api\V1\HouseholdController;
use App\Http\Controllers\Api\V1\IngredientController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\MealPlanController;
use App\Http\Controllers\Api\V1\RecipeController;
use App\Http\Controllers\Api\V1\ShoppingListController;
use App\Http\Middleware\EnsureHouseholdMembership;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::prefix('auth')->group(function (): void {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
        });
    });

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('households', [HouseholdController::class, 'index']);
        Route::post('households', [HouseholdController::class, 'store']);
        Route::get('households/{household}', [HouseholdController::class, 'show']);
        Route::post('households/{household}/members', [HouseholdController::class, 'storeMember']);

        Route::middleware(EnsureHouseholdMembership::class)->group(function (): void {
            Route::get('ingredients', [IngredientController::class, 'index']);
            Route::post('ingredients', [IngredientController::class, 'store']);

            Route::get('recipes', [RecipeController::class, 'index']);
            Route::post('recipes', [RecipeController::class, 'store']);
            Route::get('recipes/{recipe}', [RecipeController::class, 'show']);
            Route::patch('recipes/{recipe}', [RecipeController::class, 'update']);
            Route::delete('recipes/{recipe}', [RecipeController::class, 'destroy']);
            Route::post('recipes/{recipe}/favorite', [RecipeController::class, 'favorite']);
            Route::delete('recipes/{recipe}/favorite', [RecipeController::class, 'unfavorite']);

            Route::get('inventory', [InventoryController::class, 'index']);
            Route::post('inventory', [InventoryController::class, 'store']);
            Route::patch('inventory/{inventoryItem}', [InventoryController::class, 'update']);
            Route::delete('inventory/{inventoryItem}', [InventoryController::class, 'destroy']);
            Route::post('inventory/{inventoryItem}/consume', [InventoryController::class, 'consume']);

            Route::get('meal-plans', [MealPlanController::class, 'show']);
            Route::post('meal-plans/{mealPlan}/items', [MealPlanController::class, 'storeItem']);
            Route::patch('meal-plan-items/{mealPlanItem}', [MealPlanController::class, 'updateItem']);
            Route::delete('meal-plan-items/{mealPlanItem}', [MealPlanController::class, 'destroyItem']);
            Route::post('meal-plan-items/{mealPlanItem}/cook', CookMealPlanItemController::class);

            Route::get('shopping-lists', [ShoppingListController::class, 'index']);
            Route::post('shopping-lists', [ShoppingListController::class, 'store']);
            Route::get('shopping-lists/{shoppingList}', [ShoppingListController::class, 'show']);
            Route::patch('shopping-lists/{shoppingList}', [ShoppingListController::class, 'update']);
            Route::delete('shopping-lists/{shoppingList}', [ShoppingListController::class, 'destroy']);
            Route::post('shopping-lists/{shoppingList}/items', [ShoppingListController::class, 'storeItem']);
            Route::patch('shopping-lists/{shoppingList}/items/{shoppingListItem}', [ShoppingListController::class, 'updateItem']);
            Route::delete('shopping-lists/{shoppingList}/items/{shoppingListItem}', [ShoppingListController::class, 'destroyItem']);
            Route::post('shopping-lists/{shoppingList}/items/{shoppingListItem}/purchase', [ShoppingListController::class, 'purchase']);
        });
    });
});
