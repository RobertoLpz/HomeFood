import axios from 'axios'

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined
    const first = data?.errors ? Object.values(data.errors).flat()[0] : undefined
    if (first) return first
    if (data?.message) return data.message
    if (!error.response) return 'Sin conexión con el servidor.'
  }
  return 'Ocurrió un error. Inténtalo de nuevo.'
}
