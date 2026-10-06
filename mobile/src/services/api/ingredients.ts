import type { Dimension, Ingredient, Unit } from '../../types'
import { api, unwrap } from './client'

export async function listIngredients(search = ''): Promise<Ingredient[]> {
  const { data } = await api.get('/ingredients', { params: search ? { search } : {} })
  return unwrap<Ingredient[]>(data)
}

export async function createIngredient(input: {
  name: string
  dimension: Dimension
  default_unit: Unit
}): Promise<Ingredient> {
  const { data } = await api.post('/ingredients', input)
  return unwrap<Ingredient>(data)
}
