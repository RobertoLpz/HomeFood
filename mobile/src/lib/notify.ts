import { toast } from 'sonner'

export function notifySuccess(message: string, description?: string) {
  toast.success(message, { description })
}

export function notifyError(message: string) {
  toast.error(message)
}
