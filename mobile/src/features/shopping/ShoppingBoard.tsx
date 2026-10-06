import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyBlock, ErrorBlock, Field, LoadingBlock, PageTitle } from '@/components/feedback'
import { IngredientPicker } from '@/components/IngredientPicker'
import { QuantityEditor } from '@/components/quantity-editor'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { notifyError, notifySuccess } from '@/lib/notify'
import * as shoppingApi from '@/services/api/shopping'
import type { ShoppingListItem, Unit } from '@/types'
import { errorMessage } from '@/utils/errors'
import { dimensionOf, unitLabel, unitsFor } from '@/utils/units'

const qtySchema = z.object({ quantity: z.number().positive('Cantidad mayor a 0') })

function itemName(item: ShoppingListItem): string {
  return item.ingredient?.name ?? item.name ?? `Ingrediente ${item.ingredient_id}`
}

export function ShoppingBoard({ listId }: { listId: number }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [removing, setRemoving] = useState<ShoppingListItem | null>(null)
  const [picked, setPicked] = useState<{ id: number; name: string; unit: Unit } | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState<Unit>('piece')

  const ordered = useMemo(() => {
    return [...items].sort((a, b) => Number(Boolean(a.purchased_at)) - Number(Boolean(b.purchased_at)))
  }, [items])

  const pendingCount = items.filter((item) => !item.purchased_at).length

  async function load() {
    setLoading(true)
    setError('')
    try {
      const list = await shoppingApi.getShoppingList(listId)
      setName(list.name)
      setItems(list.items ?? [])
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [listId])

  async function purchase(item: ShoppingListItem) {
    if (item.purchased_at) return
    setBusyId(item.id)
    try {
      await shoppingApi.purchaseShoppingItem(listId, item.id)
      notifySuccess('Marcado como comprado', itemName(item))
      await load()
    } catch (reason) {
      notifyError(errorMessage(reason))
    } finally {
      setBusyId(null)
    }
  }

  async function saveQty(item: ShoppingListItem, next: string) {
    const parsed = qtySchema.safeParse({ quantity: Number(next) })
    if (!parsed.success) {
      notifyError(parsed.error.issues[0]?.message ?? 'Cantidad no válida')
      return
    }
    setBusyId(item.id)
    try {
      await shoppingApi.updateShoppingItem(listId, item.id, { quantity: parsed.data.quantity, unit: item.unit })
      notifySuccess('Cantidad actualizada')
      await load()
    } catch (reason) {
      notifyError(errorMessage(reason))
    } finally {
      setBusyId(null)
    }
  }

  async function onAdd(event: FormEvent) {
    event.preventDefault()
    if (!picked) {
      setFormError('Elige un ingrediente')
      return
    }
    const parsed = qtySchema.safeParse({ quantity: Number(quantity) })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Cantidad no válida')
      return
    }
    setPending(true)
    setFormError('')
    try {
      await shoppingApi.addShoppingItem(listId, { ingredient_id: picked.id, quantity: parsed.data.quantity, unit })
      notifySuccess('Agregado a la lista', picked.name)
      setPicked(null)
      setQuantity('1')
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

  async function removeItem() {
    if (!removing) return
    setPending(true)
    try {
      await shoppingApi.deleteShoppingItem(listId, removing.id)
      notifySuccess('Producto quitado')
      setRemoving(null)
      await load()
    } catch (reason) {
      notifyError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  async function removeList() {
    setPending(true)
    try {
      await shoppingApi.deleteShoppingList(listId)
      notifySuccess('Lista eliminada')
      navigate('/compras')
    } catch (reason) {
      notifyError(errorMessage(reason))
      setPending(false)
    }
  }

  if (loading) return <LoadingBlock />

  return (
    <div className="space-y-4">
      <PageTitle
        action={
          <Button type="button" onClick={() => setOpen(true)}>
            Añadir
          </Button>
        }
        hint={`${pendingCount} pendientes`}
        title={name || 'Lista'}
      />
      {error ? <ErrorBlock message={error} onRetry={() => void load()} /> : null}
      {ordered.length === 0 ? <EmptyBlock hint="El plan semanal llena lo que falta, o agrega a mano." title="Lista vacía" /> : null}
      <ul className="space-y-3">
        {ordered.map((item) => {
          const bought = Boolean(item.purchased_at)
          return (
            <li key={item.id}>
              <Card className={bought ? 'bg-muted gap-3 py-4 shadow-none' : 'gap-3 py-4'}>
                <CardContent className="space-y-3 px-4">
                  <button
                    className="w-full text-left disabled:opacity-70"
                    disabled={bought || busyId === item.id}
                    type="button"
                    onClick={() => void purchase(item)}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-lg font-semibold">{itemName(item)}</span>
                      <Badge variant={bought ? 'secondary' : 'accent'}>{bought ? 'Comprado' : 'Toca para comprar'}</Badge>
                    </span>
                    <span className="text-muted-foreground mt-1 block text-sm">
                      {item.quantity} {unitLabel(item.unit)} · {item.source === 'planned' ? 'del plan' : 'manual'}
                    </span>
                  </button>
                  {!bought ? (
                    <div className="space-y-2">
                      <QuantityEditor key={`${item.id}-${item.quantity}`} pending={busyId === item.id} value={Number(item.quantity)} onSave={(next) => saveQty(item, next)} />
                      <Button className="w-full" type="button" variant="outline" onClick={() => setRemoving(item)}>
                        Quitar
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ul>
      <Button className="w-full" type="button" variant="outline" onClick={() => setConfirmDelete(true)}>
        Eliminar lista
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar a mano</DialogTitle>
            <DialogDescription>Suma algo que no salió del plan semanal.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void onAdd(event)}>
            <IngredientPicker
              onSelect={(ingredient) => {
                setPicked({ id: ingredient.id, name: ingredient.name, unit: ingredient.default_unit })
                setUnit(ingredient.default_unit)
                setFormError('')
              }}
            />
            {picked ? <p className="text-sm font-medium">{picked.name}</p> : null}
            <div className="grid grid-cols-2 gap-2">
              <Field label="Cantidad">
                <Input inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              </Field>
              <Field label="Unidad">
                <NativeSelect value={unit} onChange={(event) => setUnit(event.target.value as Unit)}>
                  {unitsFor(dimensionOf(unit)).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            {formError ? (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
            <DialogFooter>
              <Button disabled={pending} type="submit">
                {pending ? 'Guardando…' : 'Añadir a la lista'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        confirmLabel="Quitar"
        description={removing ? `Se quitará ${itemName(removing)} de esta lista.` : ''}
        destructive
        open={removing !== null}
        pending={pending}
        title="Quitar producto"
        onConfirm={() => void removeItem()}
        onOpenChange={(next) => {
          if (!next) setRemoving(null)
        }}
      />
      <ConfirmDialog
        confirmLabel="Eliminar lista"
        description="Se borrarán también los productos de esta lista."
        destructive
        open={confirmDelete}
        pending={pending}
        title="Eliminar lista"
        onConfirm={() => void removeList()}
        onOpenChange={setConfirmDelete}
      />
    </div>
  )
}
