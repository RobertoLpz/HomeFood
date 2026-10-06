import { useEffect, useState, type FormEvent } from 'react'
import { z } from 'zod'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyBlock, ErrorBlock, Field, LoadingBlock, PageTitle } from '@/components/feedback'
import { IngredientPicker } from '@/components/IngredientPicker'
import { QuantityEditor } from '@/components/quantity-editor'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { NativeSelect } from '@/components/ui/native-select'
import { Input } from '@/components/ui/input'
import { notifyError, notifySuccess } from '@/lib/notify'
import * as inventoryApi from '@/services/api/inventory'
import type { InventoryItem, Unit } from '@/types'
import { errorMessage } from '@/utils/errors'
import { dimensionOf, unitLabel, unitsFor } from '@/utils/units'

const qtySchema = z.object({ quantity: z.number().positive('Cantidad mayor a 0') })

export function InventoryPanel() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [picked, setPicked] = useState<{ id: number; name: string; unit: Unit } | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState<Unit>('piece')
  const [removing, setRemoving] = useState<InventoryItem | null>(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      setItems(await inventoryApi.listInventory())
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function resetForm() {
    setPicked(null)
    setQuantity('1')
    setFormError('')
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
      await inventoryApi.addInventory({ ingredient_id: picked.id, quantity: parsed.data.quantity, unit })
      notifySuccess('Guardado en inventario', picked.name)
      setOpen(false)
      resetForm()
      await load()
    } catch (reason) {
      const message = errorMessage(reason)
      setFormError(message)
      notifyError(message)
    } finally {
      setPending(false)
    }
  }

  async function saveQuantity(item: InventoryItem, next: string) {
    const parsed = qtySchema.safeParse({ quantity: Number(next) })
    if (!parsed.success) {
      notifyError(parsed.error.issues[0]?.message ?? 'Cantidad no válida')
      return
    }
    setSavingId(item.id)
    try {
      await inventoryApi.updateInventory(item.id, { quantity: parsed.data.quantity, unit: item.unit, expires_on: item.expires_on })
      notifySuccess('Cantidad actualizada')
      await load()
    } catch (reason) {
      notifyError(errorMessage(reason))
    } finally {
      setSavingId(null)
    }
  }

  async function consume(item: InventoryItem) {
    setSavingId(item.id)
    try {
      await inventoryApi.consumeInventory(item.id, 1, item.unit)
      notifySuccess('Usaste 1', item.ingredient?.name ?? 'Ingrediente')
      await load()
    } catch (reason) {
      notifyError(errorMessage(reason))
    } finally {
      setSavingId(null)
    }
  }

  async function confirmRemove() {
    if (!removing) return
    setPending(true)
    try {
      await inventoryApi.deleteInventory(removing.id)
      notifySuccess('Quitado del inventario')
      setRemoving(null)
      await load()
    } catch (reason) {
      notifyError(errorMessage(reason))
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
            Agregar
          </Button>
        }
        hint="Lo que ya tienes en casa."
        title="Inventario"
      />
      {error ? <ErrorBlock message={error} onRetry={() => void load()} /> : null}
      {items.length === 0 ? <EmptyBlock hint="Agrega lo que ya tienes para planear con lo real." title="Inventario vacío" /> : null}
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <Card className="gap-3 py-4">
              <CardHeader className="px-4">
                <CardTitle>{item.ingredient?.name ?? `Ingrediente ${item.ingredient_id}`}</CardTitle>
                <p className="text-muted-foreground text-sm">{unitLabel(item.unit)}</p>
              </CardHeader>
              <CardContent className="space-y-3 px-4">
                <QuantityEditor key={`${item.id}-${item.quantity}`} pending={savingId === item.id} value={Number(item.quantity)} onSave={(next) => saveQuantity(item, next)} />
                <div className="grid grid-cols-2 gap-2">
                  <Button disabled={savingId === item.id} type="button" variant="secondary" onClick={() => void consume(item)}>
                    Usar 1
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setRemoving(item)}>
                    Quitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) resetForm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar al inventario</DialogTitle>
            <DialogDescription>Elige el ingrediente y confirma la cantidad antes de guardar.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void onAdd(event)}>
            <IngredientPicker
              onSelect={(ingredient) => {
                setPicked({ id: ingredient.id, name: ingredient.name, unit: ingredient.default_unit })
                setUnit(ingredient.default_unit)
                setFormError('')
              }}
            />
            {picked ? <p className="text-sm font-medium">Seleccionado: {picked.name}</p> : null}
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
            {formError ? (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
            <DialogFooter>
              <Button disabled={pending} type="submit">
                {pending ? 'Guardando…' : 'Guardar en inventario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        confirmLabel="Quitar"
        description={removing ? `Se eliminará ${removing.ingredient?.name ?? 'este ingrediente'} del inventario.` : ''}
        destructive
        open={removing !== null}
        pending={pending}
        title="Quitar del inventario"
        onConfirm={() => void confirmRemove()}
        onOpenChange={(next) => {
          if (!next) setRemoving(null)
        }}
      />
    </div>
  )
}
