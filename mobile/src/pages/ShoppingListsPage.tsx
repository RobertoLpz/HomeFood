import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { EmptyBlock, ErrorBlock, Field, LoadingBlock, PageTitle } from '@/components/feedback'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { notifyError, notifySuccess } from '@/lib/notify'
import * as shoppingApi from '@/services/api/shopping'
import type { ShoppingList } from '@/types'
import { startOfWeek } from '@/utils/dates'
import { errorMessage } from '@/utils/errors'

const schema = z.object({ name: z.string().trim().min(2, 'Nombre muy corto') })

export function ShoppingListsPage() {
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [name, setName] = useState('Compras de la semana')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      setLists(await shoppingApi.listShoppingLists())
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    const parsed = schema.safeParse({ name })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Revisa el nombre')
      return
    }
    setPending(true)
    setFormError('')
    try {
      await shoppingApi.createShoppingList({ name: parsed.data.name, week_start: startOfWeek() })
      notifySuccess('Lista creada', parsed.data.name)
      setName('Compras de la semana')
      setOpen(false)
      await load()
    } catch (reason) {
      const message = errorMessage(reason)
      setFormError(message)
      notifyError(message)
    } finally {
      setPending(false)
    }
  }

  if (loading) return <LoadingBlock />

  return (
    <div className="space-y-4">
      <PageTitle
        action={
          <Button type="button" onClick={() => setOpen(true)}>
            Nueva
          </Button>
        }
        hint="Una lista por semana, o las que necesites."
        title="Compras"
      />
      {error ? <ErrorBlock message={error} onRetry={() => void load()} /> : null}
      {lists.length === 0 ? <EmptyBlock hint="Crea una para esta semana." title="Sin listas" /> : null}
      <ul className="space-y-3">
        {lists.map((list) => (
          <li key={list.id}>
            <Link className="bg-card flex min-h-16 items-center rounded-3xl border px-4 text-lg font-semibold" to={`/compras/${list.id}`}>
              {list.name}
            </Link>
          </li>
        ))}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva lista</DialogTitle>
            <DialogDescription>Quedará asociada a la semana actual.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void onCreate(event)}>
            <Field label="Nombre">
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            {formError ? (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
            <DialogFooter>
              <Button disabled={pending} type="submit">
                {pending ? 'Guardando…' : 'Crear lista'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
