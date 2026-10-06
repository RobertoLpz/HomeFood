import type { AuthPayload, User } from '../../types'
import { api, unwrap } from './client'

export async function register(input: {
  name: string
  email: string
  password: string
  password_confirmation: string
}): Promise<AuthPayload> {
  const { data } = await api.post('/auth/register', input)
  return unwrap<AuthPayload>(data)
}

export async function login(input: { email: string; password: string }): Promise<AuthPayload> {
  const { data } = await api.post('/auth/login', input)
  return unwrap<AuthPayload>(data)
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function me(): Promise<User> {
  const { data } = await api.get('/auth/me')
  const payload = unwrap<User | { user: User }>(data)
  if (payload && typeof payload === 'object' && 'user' in payload) {
    return payload.user
  }
  return payload
}
