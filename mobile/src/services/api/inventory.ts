import type { InventoryItem, Unit } from '../../types'
import { api, unwrap } from './client'

export async function listInventory(): Promise<InventoryItem[]> {
  const { data } = await api.get('/inventory')
  return unwrap<InventoryItem[]>(data)
}

export async function addInventory(input: {
  ingredient_id: number
  quantity: number
  unit: Unit
  expires_on?: string | null
}): Promise<InventoryItem> {
  const { data } = await api.post('/inventory', input)
  return unwrap<InventoryItem>(data)
}

export async function updateInventory(
  id: number,
  input: { quantity: number; unit: Unit; expires_on?: string | null },
): Promise<InventoryItem> {
  const { data } = await api.patch(`/inventory/${id}`, input)
  return unwrap<InventoryItem>(data)
}

export async function consumeInventory(id: number, quantity: number, unit: Unit): Promise<InventoryItem> {
  const { data } = await api.post(`/inventory/${id}/consume`, { quantity, unit })
  return unwrap<InventoryItem>(data)
}

export async function deleteInventory(id: number): Promise<void> {
  await api.delete(`/inventory/${id}`)
}
