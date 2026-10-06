import type { MealPlan, MealType } from '../../types'
import { api, unwrap } from './client'

export async function getMealPlan(week: string): Promise<MealPlan> {
  const { data } = await api.get('/meal-plans', { params: { week } })
  const plan = unwrap<MealPlan>(data)
  return { ...plan, items: plan.items ?? [] }
}

export async function addMealPlanItem(
  mealPlanId: number,
  input: { recipe_id: number; planned_on: string; meal_type: MealType; servings: number },
): Promise<void> {
  await api.post(`/meal-plans/${mealPlanId}/items`, input)
}

export async function deleteMealPlanItem(itemId: number): Promise<void> {
  await api.delete(`/meal-plan-items/${itemId}`)
}

export async function cookMealPlanItem(itemId: number): Promise<void> {
  await api.post(`/meal-plan-items/${itemId}/cook`)
}
