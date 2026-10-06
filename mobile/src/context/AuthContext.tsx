import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '../services/api/auth'
import { setUnauthorizedHandler } from '../services/api/client'
import { HOUSEHOLD_KEY, removeItem, setItem, TOKEN_KEY, getItem } from '../services/native/storage'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  const clearSession = useCallback(async () => {
    await removeItem(TOKEN_KEY)
    await removeItem(HOUSEHOLD_KEY)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession()
    })
  }, [clearSession])

  useEffect(() => {
    let active = true
    async function restore() {
      const token = await getItem(TOKEN_KEY)
      if (!token) {
        if (active) setReady(true)
        return
      }
      try {
        const current = await authApi.me()
        if (active) setUser(current)
      } catch {
        await clearSession()
      } finally {
        if (active) setReady(true)
      }
    }
    void restore()
    return () => {
      active = false
    }
  }, [clearSession])

  const login = useCallback(async (email: string, password: string) => {
    const payload = await authApi.login({ email, password })
    await setItem(TOKEN_KEY, payload.token)
    setUser(payload.user)
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string, passwordConfirmation: string) => {
      const payload = await authApi.register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
      await setItem(TOKEN_KEY, payload.token)
      setUser(payload.user)
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // La sesión local se cierra aunque el servidor no responda.
    }
    await clearSession()
  }, [clearSession])

  const value = useMemo(
    () => ({ user, ready, login, register, logout }),
    [user, ready, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
