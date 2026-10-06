import type { ShoppingList, ShoppingListItem, Unit } from '../../types'
import { api, unwrap } from './client'

export async function listShoppingLists(): Promise<ShoppingList[]> {
  const { data } = await api.get('/shopping-lists')
  return unwrap<ShoppingList[]>(data)
}

export async function getShoppingList(id: number): Promise<ShoppingList> {
  const { data } = await api.get(`/shopping-lists/${id}`)
  const list = unwrap<ShoppingList>(data)
  return { ...list, items: list.items ?? [] }
}

export async function createShoppingList(input: {
  name: string
  week_start?: string | null
}): Promise<ShoppingList> {
  const { data } = await api.post('/shopping-lists', input)
  return unwrap<ShoppingList>(data)
}

export async function deleteShoppingList(id: number): Promise<void> {
  await api.delete(`/shopping-lists/${id}`)
}

export async function addShoppingItem(
  listId: number,
  input: { ingredient_id: number; quantity: number; unit: Unit },
): Promise<ShoppingListItem> {
  const { data } = await api.post(`/shopping-lists/${listId}/items`, input)
  return unwrap<ShoppingListItem>(data)
}

export async function updateShoppingItem(
  listId: number,
  itemId: number,
  input: { quantity: number; unit: Unit },
): Promise<ShoppingListItem> {
  const { data } = await api.patch(`/shopping-lists/${listId}/items/${itemId}`, input)
  return unwrap<ShoppingListItem>(data)
}

export async function deleteShoppingItem(listId: number, itemId: number): Promise<void> {
  await api.delete(`/shopping-lists/${listId}/items/${itemId}`)
}

export async function purchaseShoppingItem(listId: number, itemId: number): Promise<void> {
  await api.post(`/shopping-lists/${listId}/items/${itemId}/purchase`, {})
}
