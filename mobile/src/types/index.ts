export type Dimension = 'count' | 'mass' | 'volume'
export type Unit = 'piece' | 'g' | 'kg' | 'ml' | 'l'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type ItemSource = 'manual' | 'planned'
export type Role = 'owner' | 'member'

export interface User {
  id: number
  name: string
  email: string
}

export interface AuthPayload {
  token: string
  user: User
}

export interface Household {
  id: number
  name: string
  role?: Role
}

export interface HouseholdMember {
  id: number
  name: string
  email: string
  role: Role
}

export interface Ingredient {
  id: number
  household_id: number | null
  name: string
  dimension: Dimension
  default_unit: Unit
}

export interface RecipeIngredient {
  id?: number
  ingredient_id: number
  name?: string
  ingredient?: Ingredient | null
  quantity: number
  unit: Unit
  is_optional: boolean
}

export interface Recipe {
  id: number
  name: string
  description: string | null
  prep_minutes: number
  servings: number
  difficulty: Difficulty
  instructions: string
  is_favorite: boolean
  ingredients: RecipeIngredient[]
}

export interface InventoryItem {
  id: number
  ingredient_id: number
  ingredient?: Ingredient | null
  quantity: number
  unit: Unit
  expires_on: string | null
}

export interface MealPlanItem {
  id: number
  recipe_id: number
  recipe?: { id: number; name: string } | null
  planned_on: string
  meal_type: MealType
  servings: number
  notes: string | null
  cooked_at: string | null
}

export interface MealPlan {
  id: number
  week_start: string
  items: MealPlanItem[]
}

export interface ShoppingListItem {
  id: number
  ingredient_id: number
  ingredient?: Ingredient | null
  name?: string
  quantity: number
  unit: Unit
  purchased_at: string | null
  price: string | number | null
  source: ItemSource
}

export interface ShoppingList {
  id: number
  name: string
  week_start: string | null
  items?: ShoppingListItem[]
}

export interface RecipeInput {
  name: string
  description?: string | null
  prep_minutes: number
  servings: number
  difficulty: Difficulty
  instructions: string
  ingredients: Array<{
    ingredient_id: number
    quantity: number
    unit: Unit
    is_optional: boolean
  }>
}
