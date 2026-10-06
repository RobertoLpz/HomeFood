import { useEffect, useState, type FormEvent } from 'react'
import { z } from 'zod'
import { IngredientPicker } from '../../components/IngredientPicker'
import { ErrorBlock, Field, buttonClass, inputClass } from '../../components/ui'
import * as ingredientApi from '../../services/api/ingredients'
import type { Dimension, Unit } from '../../types'
import { errorMessage } from '../../utils/errors'
import { DIMENSIONS, unitsFor } from '../../utils/units'

const schema = z.object({
  name: z.string().trim().min(2, 'Nombre muy corto'),
  dimension: z.enum(['count', 'mass', 'volume']),
  default_unit: z.enum(['piece', 'g', 'kg', 'ml', 'l']),
})

export function IngredientCreator() {
  const [name, setName] = useState('')
  const [dimension, setDimension] = useState<Dimension>('count')
  const [unit, setUnit] = useState<Unit>('piece')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const next = unitsFor(dimension)[0]?.value
    if (next) setUnit(next)
  }, [dimension])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = schema.safeParse({ name, dimension, default_unit: unit })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa el formulario')
      return
    }
    setError('')
    try {
      await ingredientApi.createIngredient(parsed.data)
      setName('')
      setNotice('Ingrediente creado para este hogar.')
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }

  return (
    <div className="space-y-4">
      <IngredientPicker onSelect={(ingredient) => setNotice(`${ingredient.name} ya existe.`)} />
      <form className="space-y-3" onSubmit={(event) => void onSubmit(event)}>
        <h2 className="text-lg font-semibold">Crear del hogar</h2>
        <Field label="Nombre">
          <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Tipo">
          <select className={inputClass} value={dimension} onChange={(event) => setDimension(event.target.value as Dimension)}>
            {DIMENSIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Unidad base">
          <select className={inputClass} value={unit} onChange={(event) => setUnit(event.target.value as Unit)}>
            {unitsFor(dimension).map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <button className={`${buttonClass} w-full`} type="submit">
          Crear ingrediente
        </button>
      </form>
      {notice ? <p className="text-emerald-800">{notice}</p> : null}
      {error ? <ErrorBlock message={error} /> : null}
    </div>
  )
}
