import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import * as ingredientApi from '@/services/api/ingredients'
import type { Ingredient } from '@/types'
import { errorMessage } from '@/utils/errors'

export function IngredientPicker({ onSelect }: { onSelect: (ingredient: Ingredient) => void }) {
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
      <Input placeholder="Buscar ingrediente" value={query} onChange={(event) => setQuery(event.target.value)} />
      <p className="text-muted-foreground mt-2 text-xs">
        {query.trim() ? 'Resultados de tu búsqueda' : 'Ingredientes del hogar y del sistema'}
      </p>
      {error ? <p className="text-destructive mt-2 text-sm">{error}</p> : null}
      <ul className="bg-card mt-2 max-h-48 overflow-auto rounded-2xl border">
        {items.length === 0 ? (
          <li className="text-muted-foreground px-3 py-4 text-sm">Sin coincidencias. Prueba otro nombre.</li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="border-b last:border-b-0">
              <button className="hover:bg-accent flex min-h-12 w-full items-center justify-between px-3 text-left" type="button" onClick={() => onSelect(item)}>
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground text-sm">{item.household_id ? 'Hogar' : 'Sistema'}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
