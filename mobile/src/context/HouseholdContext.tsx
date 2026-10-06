import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import * as householdApi from '../services/api/households'
import { getItem, HOUSEHOLD_KEY, setItem } from '../services/native/storage'
import type { Household, HouseholdMember } from '../types'

interface HouseholdContextValue {
  households: Household[]
  current: Household | null
  members: HouseholdMember[]
  ready: boolean
  refresh: () => Promise<void>
  select: (id: number) => Promise<void>
  create: (name: string) => Promise<void>
  addMember: (email: string) => Promise<void>
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null)

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [households, setHouseholds] = useState<Household[]>([])
  const [current, setCurrent] = useState<Household | null>(null)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [ready, setReady] = useState(false)

  const loadMembers = useCallback(async (household: Household | null) => {
    if (!household) {
      setMembers([])
      return
    }
    try {
      const detail = await householdApi.getHousehold(household.id)
      setMembers(detail.members ?? [])
    } catch {
      setMembers([])
    }
  }, [])

  const refresh = useCallback(async () => {
    const list = await householdApi.listHouseholds()
    setHouseholds(list)
    const stored = await getItem(HOUSEHOLD_KEY)
    const match = list.find((item) => String(item.id) === stored) ?? list[0] ?? null
    if (match) {
      await setItem(HOUSEHOLD_KEY, String(match.id))
    }
    setCurrent(match)
    await loadMembers(match)
  }, [loadMembers])

  useEffect(() => {
    if (!user) {
      setHouseholds([])
      setCurrent(null)
      setMembers([])
      setReady(true)
      return
    }
    let active = true
    setReady(false)
    void refresh()
      .catch(() => {
        if (active) {
          setHouseholds([])
          setCurrent(null)
        }
      })
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [user, refresh])

  const select = useCallback(
    async (id: number) => {
      const match = households.find((item) => item.id === id)
      if (!match) return
      await setItem(HOUSEHOLD_KEY, String(id))
      setCurrent(match)
      await loadMembers(match)
    },
    [households, loadMembers],
  )

  const create = useCallback(
    async (name: string) => {
      const created = await householdApi.createHousehold(name)
      await setItem(HOUSEHOLD_KEY, String(created.id))
      await refresh()
    },
    [refresh],
  )

  const addMember = useCallback(
    async (email: string) => {
      if (!current) return
      await householdApi.addMember(current.id, email)
      await loadMembers(current)
    },
    [current, loadMembers],
  )

  const value = useMemo(
    () => ({ households, current, members, ready, refresh, select, create, addMember }),
    [households, current, members, ready, refresh, select, create, addMember],
  )

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>
}

export function useHousehold(): HouseholdContextValue {
  const context = useContext(HouseholdContext)
  if (!context) throw new Error('useHousehold debe usarse dentro de HouseholdProvider')
  return context
}
