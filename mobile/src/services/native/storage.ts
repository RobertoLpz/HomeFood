import { Capacitor } from '@capacitor/core'

export const TOKEN_KEY = 'hf_token'
export const HOUSEHOLD_KEY = 'hf_household_id'

async function preferences() {
  const module = await import('@capacitor/preferences')
  return module.Preferences
}

export async function getItem(key: string): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const store = await preferences()
    const { value } = await store.get({ key })
    return value
  }
  return localStorage.getItem(key)
}

export async function setItem(key: string, value: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const store = await preferences()
    await store.set({ key, value })
    return
  }
  localStorage.setItem(key, value)
}

export async function removeItem(key: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const store = await preferences()
    await store.remove({ key })
    return
  }
  localStorage.removeItem(key)
}
