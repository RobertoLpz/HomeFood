import type { Recipe, RecipeInput } from '../../types'
import { api, unwrap } from './client'

export async function listRecipes(): Promise<Recipe[]> {
  const { data } = await api.get('/recipes')
  return unwrap<Recipe[]>(data)
}

export async function getRecipe(id: number): Promise<Recipe> {
  const { data } = await api.get(`/recipes/${id}`)
  return unwrap<Recipe>(data)
}

export async function createRecipe(input: RecipeInput): Promise<Recipe> {
  const { data } = await api.post('/recipes', input)
  return unwrap<Recipe>(data)
}

export async function updateRecipe(id: number, input: RecipeInput): Promise<Recipe> {
  const { data } = await api.patch(`/recipes/${id}`, input)
  return unwrap<Recipe>(data)
}

export async function deleteRecipe(id: number): Promise<void> {
  await api.delete(`/recipes/${id}`)
}

export async function favoriteRecipe(id: number): Promise<void> {
  await api.post(`/recipes/${id}/favorite`)
}

export async function unfavoriteRecipe(id: number): Promise<void> {
  await api.delete(`/recipes/${id}/favorite`)
}
