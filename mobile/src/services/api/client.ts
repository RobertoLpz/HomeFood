import axios, { type AxiosError } from 'axios'
import { getItem, HOUSEHOLD_KEY, TOKEN_KEY } from '../native/storage'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

api.interceptors.request.use(async (config) => {
  const token = await getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const url = config.url ?? ''
  const isAuth = url.includes('auth/')
  if (!isAuth) {
    const householdId = await getItem(HOUSEHOLD_KEY)
    if (householdId) {
      config.headers['X-Household-Id'] = householdId
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url ?? ''
    const isCredentialAttempt = url.includes('auth/login') || url.includes('auth/register')
    if (error.response?.status === 401 && !isCredentialAttempt) {
      onUnauthorized?.()
    }
    return Promise.reject(error)
  },
)

export function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: T }).data
  }
  return body as T
}
