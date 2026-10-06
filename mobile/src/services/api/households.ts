import type { Household, HouseholdMember } from '../../types'
import { api, unwrap } from './client'

export async function listHouseholds(): Promise<Household[]> {
  const { data } = await api.get('/households')
  return unwrap<Household[]>(data)
}

export async function createHousehold(name: string): Promise<Household> {
  const { data } = await api.post('/households', { name })
  return unwrap<Household>(data)
}

export async function getHousehold(id: number): Promise<Household & { members?: HouseholdMember[] }> {
  const { data } = await api.get(`/households/${id}`)
  return unwrap<Household & { members?: HouseholdMember[] }>(data)
}

export async function addMember(householdId: number, email: string): Promise<void> {
  await api.post(`/households/${householdId}/members`, { email })
}
