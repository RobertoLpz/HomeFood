import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { z } from 'zod'
import { IngredientPicker } from '../../components/IngredientPicker'
import { EmptyBlock, ErrorBlock, LoadingBlock, buttonClass, inputClass, secondaryButtonClass } from '../../components/ui'
import * as shoppingApi from '../../services/api/shopping'
import type { ShoppingListItem, Unit } from '../../types'
import { errorMessage } from '../../utils/errors'
import { dimensionOf, unitLabel, unitsFor } from '../../utils/units'

const qtySchema = z.object({ quantity: z.number().positive('Cantidad mayor a 0') })

function itemName(item: ShoppingListItem): string {
  return item.ingredient?.name ?? item.name ?? `Ingrediente ${item.ingredient_id}`
}

export function ShoppingBoard({ listId }: { listId: number }) {
  const [name, setName] = useState('')
  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [picked, setPicked] = useState<{ id: number; name: string; unit: Unit } | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState<Unit>('piece')

  const ordered = useMemo(() => {
    return [...items].sort((a, b) => Number(Boolean(a.purchased_at)) - Number(Boolean(b.purchased_at)))
  }, [items])

  const pending = items.filter((item) => !item.purchased_at).length

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
      await load()
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusyId(null)
    }
  }

  async function saveQty(item: ShoppingListItem, next: string) {
    const parsed = qtySchema.safeParse({ quantity: Number(next) })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Cantidad no válida')
      return
    }
    try {
      await shoppingApi.updateShoppingItem(listId, item.id, { quantity: parsed.data.quantity, unit: item.unit })
      await load()
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }

  async function onAdd(event: FormEvent) {
    event.preventDefault()
    if (!picked) {
      setError('Elige un ingrediente')
      return
    }
    const parsed = qtySchema.safeParse({ quantity: Number(quantity) })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Cantidad no válida')
      return
    }
    try {
      await shoppingApi.addShoppingItem(listId, { ingredient_id: picked.id, quantity: parsed.data.quantity, unit })
      setPicked(null)
      setQuantity('1')
      await load()
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }

  if (loading) return <LoadingBlock />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{name}</h1>
        <p className="text-stone-500">{pending} pendientes</p>
      </div>
      {error ? <ErrorBlock message={error} onRetry={() => void load()} /> : null}
      {ordered.length === 0 ? <EmptyBlock title="Lista vacía" hint="El plan semanal llena lo que falta, o agrega a mano." /> : null}
      <ul className="space-y-3">
        {ordered.map((item) => {
          const bought = Boolean(item.purchased_at)
          return (
            <li key={item.id} className={`rounded-2xl p-3 ${bought ? 'bg-stone-200' : 'bg-white'}`}>
              <button type="button" className="min-h-16 w-full text-left" disabled={bought || busyId === item.id} onClick={() => void purchase(item)}>
                <span className="text-lg font-semibold">{itemName(item)}</span>
                <span className="mt-1 block text-stone-600">
                  {item.quantity} {unitLabel(item.unit)} · {item.source === 'planned' ? 'del plan' : 'manual'}
                  {bought ? ' · comprado' : ' · toca para comprar'}
                </span>
              </button>
              {!bought ? (
                <div className="mt-2 flex gap-2">
                  <input className={inputClass} defaultValue={String(item.quantity)} inputMode="decimal" onBlur={(event) => void saveQty(item, event.target.value)} />
                  <button type="button" className="min-h-12 px-3 text-red-700" onClick={() => void shoppingApi.deleteShoppingItem(listId, item.id).then(load).catch((reason: unknown) => setError(errorMessage(reason)))}>
                    Borrar
                  </button>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
      <form className="space-y-3 rounded-2xl bg-white p-3" onSubmit={(event) => void onAdd(event)}>
        <h2 className="font-semibold">Agregar a mano</h2>
        <IngredientPicker
          onSelect={(ingredient) => {
            setPicked({ id: ingredient.id, name: ingredient.name, unit: ingredient.default_unit })
            setUnit(ingredient.default_unit)
          }}
        />
        {picked ? <p className="text-sm">{picked.name}</p> : null}
        <div className="grid grid-cols-2 gap-2">
          <input className={inputClass} inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          <select className={inputClass} value={unit} onChange={(event) => setUnit(event.target.value as Unit)}>
            {unitsFor(dimensionOf(unit)).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button className={`${buttonClass} w-full`} type="submit">
          Añadir
        </button>
      </form>
      <button type="button" className={`${secondaryButtonClass} w-full`} onClick={() => void shoppingApi.deleteShoppingList(listId).then(() => { window.location.assign('/compras') })}>
        Eliminar lista
      </button>
    </div>
  )
}
