<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('households', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('household_user', function (Blueprint $table) {
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role');
            $table->primary(['household_id', 'user_id']);
        });

        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('normalized_name');
            $table->string('dimension');
            $table->string('default_unit');
            $table->timestamps();

            $table->unsignedBigInteger('household_scope')->default(0);
            $table->unique(['household_scope', 'normalized_name']);
            $table->index('normalized_name');
        });

        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->unsignedInteger('prep_minutes');
            $table->decimal('servings', 8, 2);
            $table->string('difficulty');
            $table->text('instructions');
            $table->string('source')->default('manual');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('recipe_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 10, 3);
            $table->string('unit');
            $table->boolean('is_optional')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
        });

        Schema::create('recipe_favorites', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->primary(['user_id', 'recipe_id']);
        });

        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 10, 3);
            $table->string('unit');
            $table->date('expires_on')->nullable();
            $table->timestamps();

            $table->unique(['household_id', 'ingredient_id']);
        });

        Schema::create('meal_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->date('week_start');
            $table->timestamps();

            $table->unique(['household_id', 'week_start']);
        });

        Schema::create('meal_plan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meal_plan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recipe_id')->constrained()->restrictOnDelete();
            $table->date('planned_on');
            $table->string('meal_type');
            $table->decimal('servings', 8, 2);
            $table->text('notes')->nullable();
            $table->timestamp('cooked_at')->nullable();
            $table->timestamps();

            $table->unique(['meal_plan_id', 'planned_on', 'meal_type']);
        });

        Schema::create('shopping_lists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->date('week_start')->nullable();
            $table->timestamps();
        });

        Schema::create('shopping_list_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shopping_list_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 10, 3);
            $table->string('unit');
            $table->timestamp('purchased_at')->nullable();
            $table->decimal('price', 10, 2)->nullable();
            $table->string('source');
            $table->timestamps();
        });

        Schema::create('purchase_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shopping_list_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('shopping_list_item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 10, 3);
            $table->string('unit');
            $table->decimal('price', 10, 2)->nullable();
            $table->string('store')->nullable();
            $table->date('purchased_on');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_histories');
        Schema::dropIfExists('shopping_list_items');
        Schema::dropIfExists('shopping_lists');
        Schema::dropIfExists('meal_plan_items');
        Schema::dropIfExists('meal_plans');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('recipe_favorites');
        Schema::dropIfExists('recipe_ingredients');
        Schema::dropIfExists('recipes');
        Schema::dropIfExists('ingredients');
        Schema::dropIfExists('household_user');
        Schema::dropIfExists('households');
    }
};
