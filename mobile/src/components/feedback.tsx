import type { ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

export function LoadingBlock({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="grid gap-3" role="status" aria-live="polite">
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <p className="text-muted-foreground text-center text-sm">{label}</p>
    </div>
  )
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>No se pudo completar</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        {onRetry ? (
          <Button className="mt-3" size="sm" type="button" variant="outline" onClick={onRetry}>
            Reintentar
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}

export function EmptyBlock({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <Card className="items-center border-dashed px-6 py-10 text-center shadow-none">
      <CardTitle>{title}</CardTitle>
      {hint ? <CardDescription>{hint}</CardDescription> : null}
      {action}
    </Card>
  )
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}

export function PageTitle({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {hint ? <p className="text-muted-foreground mt-1 text-sm">{hint}</p> : null}
      </div>
      {action}
    </div>
  )
}
