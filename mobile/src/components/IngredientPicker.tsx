import { useEffect, useState } from 'react'
import * as ingredientApi from '../services/api/ingredients'
import type { Ingredient } from '../types'
import { errorMessage } from '../utils/errors'
import { inputClass } from './ui'

export function IngredientPicker({
  onSelect,
}: {
  onSelect: (ingredient: Ingredient) => void
}) {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<Ingredient[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      void ingredientApi
        .listIngredients(query.trim())
        .then((list) => {
          if (active) {
            setItems(list)
            setError('')
          }
        })
        .catch((reason: unknown) => {
          if (active) setError(errorMessage(reason))
        })
    }, 250)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [query])

  return (
    <div>
      <input
        className={inputClass}
        value={query}
        placeholder="Buscar ingrediente"
        onChange={(event) => setQuery(event.target.value)}
      />
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <ul className="mt-2 max-h-48 overflow-auto rounded-xl border border-stone-200 bg-white">
        {items.length === 0 ? (
          <li className="px-3 py-3 text-sm text-stone-500">Sin resultados.</li>
        ) : (
          items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="min-h-12 w-full px-3 text-left"
                onClick={() => onSelect(item)}
              >
                {item.name}
                <span className="ml-2 text-sm text-stone-500">
                  {item.household_id ? 'hogar' : 'sistema'}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
