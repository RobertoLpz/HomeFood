import { useEffect, useState, type FormEvent } from 'react'
import { z } from 'zod'
import { IngredientPicker } from '../../components/IngredientPicker'
import { EmptyBlock, ErrorBlock, Field, LoadingBlock, buttonClass, inputClass } from '../../components/ui'
import * as inventoryApi from '../../services/api/inventory'
import type { InventoryItem, Unit } from '../../types'
import { errorMessage } from '../../utils/errors'
import { unitLabel, unitsFor, dimensionOf } from '../../utils/units'

const qtySchema = z.object({ quantity: z.number().positive('Cantidad mayor a 0') })

export function InventoryPanel() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [picked, setPicked] = useState<{ id: number; name: string; unit: Unit } | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState<Unit>('piece')

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
    setError('')
    try {
      await inventoryApi.addInventory({ ingredient_id: picked.id, quantity: parsed.data.quantity, unit })
      setPicked(null)
      setQuantity('1')
      await load()
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }

  async function saveQuantity(item: InventoryItem, next: string) {
    const parsed = qtySchema.safeParse({ quantity: Number(next) })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Cantidad no válida')
      return
    }
    try {
      await inventoryApi.updateInventory(item.id, { quantity: parsed.data.quantity, unit: item.unit, expires_on: item.expires_on })
      await load()
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }

  async function consume(item: InventoryItem) {
    const parsed = qtySchema.safeParse({ quantity: 1 })
    if (!parsed.success) return
    try {
      await inventoryApi.consumeInventory(item.id, 1, item.unit)
      await load()
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }

  if (loading) return <LoadingBlock />

  return (
    <div className="space-y-4">
      {error ? <ErrorBlock message={error} onRetry={() => void load()} /> : null}
      {items.length === 0 ? <EmptyBlock title="Inventario vacío" hint="Agrega lo que ya tienes en casa." /> : null}
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl bg-white p-3">
            <p className="font-semibold">{item.ingredient?.name ?? `Ingrediente ${item.ingredient_id}`}</p>
            <p className="text-sm text-stone-500">{unitLabel(item.unit)}</p>
            <div className="mt-2 flex gap-2">
              <input
                className={inputClass}
                defaultValue={String(item.quantity)}
                inputMode="decimal"
                onBlur={(event) => void saveQuantity(item, event.target.value)}
              />
              <button type="button" className="min-h-12 rounded-xl bg-amber-100 px-3 font-semibold" onClick={() => void consume(item)}>
                Usar 1
              </button>
              <button type="button" className="min-h-12 px-2 text-red-700" onClick={() => void inventoryApi.deleteInventory(item.id).then(load).catch((reason: unknown) => setError(errorMessage(reason)))}>
                Borrar
              </button>
            </div>
          </li>
        ))}
      </ul>
      <form className="space-y-3 rounded-2xl bg-white p-3" onSubmit={(event) => void onAdd(event)}>
        <h2 className="font-semibold">Agregar</h2>
        <IngredientPicker
          onSelect={(ingredient) => {
            setPicked({ id: ingredient.id, name: ingredient.name, unit: ingredient.default_unit })
            setUnit(ingredient.default_unit)
          }}
        />
        {picked ? <p className="text-sm">Seleccionado: {picked.name}</p> : null}
        <Field label="Cantidad">
          <input className={inputClass} inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        </Field>
        <Field label="Unidad">
          <select className={inputClass} value={unit} onChange={(event) => setUnit(event.target.value as Unit)}>
            {unitsFor(dimensionOf(unit)).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <button className={`${buttonClass} w-full`} type="submit">
          Guardar en inventario
        </button>
      </form>
    </div>
  )
}
