import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { EmptyBlock, ErrorBlock, Field, LoadingBlock, buttonClass, inputClass } from '../components/ui'
import * as shoppingApi from '../services/api/shopping'
import type { ShoppingList } from '../types'
import { startOfWeek } from '../utils/dates'
import { errorMessage } from '../utils/errors'

const schema = z.object({ name: z.string().trim().min(2, 'Nombre muy corto') })

export function ShoppingListsPage() {
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [name, setName] = useState('Compras de la semana')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      setError(parsed.error.issues[0]?.message ?? 'Revisa el nombre')
      return
    }
    try {
      await shoppingApi.createShoppingList({ name: parsed.data.name, week_start: startOfWeek() })
      setName('Compras de la semana')
      await load()
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }

  if (loading) return <LoadingBlock />

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Compras</h1>
      {error ? <ErrorBlock message={error} onRetry={() => void load()} /> : null}
      {lists.length === 0 ? <EmptyBlock title="Sin listas" hint="Crea una para esta semana." /> : null}
      <ul className="space-y-2">
        {lists.map((list) => (
          <li key={list.id}>
            <Link className="flex min-h-16 items-center rounded-2xl bg-white px-4 text-lg font-semibold" to={`/compras/${list.id}`}>
              {list.name}
            </Link>
          </li>
        ))}
      </ul>
      <form className="space-y-3" onSubmit={(event) => void onCreate(event)}>
        <Field label="Nueva lista">
          <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <button className={`${buttonClass} w-full`} type="submit">
          Crear lista
        </button>
      </form>
    </div>
  )
}
