import type { AuthPayload, User } from '../../types'
import { api, unwrap } from './client'

function session(body: unknown): AuthPayload {
  const record = body && typeof body === 'object' ? (body as { token?: string; data?: User; user?: User }) : {}
  const user = record.user ?? unwrap<User>(body)
  const token = record.token
  if (!token || !user?.id) {
    throw new Error('La respuesta de acceso no incluye sesión.')
  }
  return { token, user }
}

export async function register(input: {
  name: string
  email: string
  password: string
  password_confirmation: string
}): Promise<AuthPayload> {
  const { data } = await api.post('/auth/register', input)
  return session(data)
}

export async function login(input: { email: string; password: string }): Promise<AuthPayload> {
  const { data } = await api.post('/auth/login', input)
  return session(data)
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
