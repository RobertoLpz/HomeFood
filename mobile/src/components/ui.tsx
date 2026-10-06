import type { ReactNode } from 'react'

export function LoadingBlock({ label = 'Cargando…' }: { label?: string }) {
  return (
    <p className="rounded-2xl bg-white px-4 py-8 text-center text-stone-500" role="status">
      {label}
    </p>
  )
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl bg-red-50 px-4 py-4 text-red-800" role="alert">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="mt-3 min-h-11 font-medium underline" onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  )
}

export function EmptyBlock({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center">
      <p className="text-lg font-medium text-stone-800">{title}</p>
      {hint ? <p className="mt-2 text-stone-500">{hint}</p> : null}
    </div>
  )
}

export function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  )
}

export const inputClass =
  'min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none focus:border-emerald-700'

export const buttonClass =
  'inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-800 px-4 text-base font-semibold text-white disabled:opacity-60'

export const secondaryButtonClass =
  'inline-flex min-h-12 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-base font-semibold text-stone-800'
