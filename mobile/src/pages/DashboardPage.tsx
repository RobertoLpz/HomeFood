import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorBlock, LoadingBlock } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import * as inventoryApi from '../services/api/inventory'
import * as mealApi from '../services/api/mealPlans'
import * as shoppingApi from '../services/api/shopping'
import type { MealPlanItem, ShoppingListItem } from '../types'
import { isoDate, mealLabel, startOfWeek } from '../utils/dates'
import { errorMessage } from '../utils/errors'
import { unitLabel } from '../utils/units'

function itemName(item: ShoppingListItem): string {
  return item.ingredient?.name ?? item.name ?? 'Producto'
}

export function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [planned, setPlanned] = useState(0)
  const [pending, setPending] = useState(0)
  const [stock, setStock] = useState(0)
  const [nextMeal, setNextMeal] = useState<MealPlanItem | null>(null)
  const [missing, setMissing] = useState<ShoppingListItem[]>([])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const week = startOfWeek()
      const today = isoDate(new Date())
      const [plan, lists, inventory] = await Promise.all([
        mealApi.getMealPlan(week),
        shoppingApi.listShoppingLists(),
        inventoryApi.listInventory(),
      ])
      const weekList = lists.find((list) => list.week_start === week) ?? lists[0]
      const detail = weekList ? await shoppingApi.getShoppingList(weekList.id) : null
      const plannedItems = (detail?.items ?? []).filter((item) => item.source === 'planned' && !item.purchased_at)
      const upcoming = [...plan.items]
        .filter((item) => item.planned_on >= today && !item.cooked_at)
        .sort((a, b) => a.planned_on.localeCompare(b.planned_on))
      setPlanned(plan.items.length)
      setPending((detail?.items ?? []).filter((item) => !item.purchased_at).length)
      setStock(inventory.filter((item) => Number(item.quantity) > 0).length)
      setNextMeal(upcoming[0] ?? null)
      setMissing(plannedItems.slice(0, 4))
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading) return <LoadingBlock />
  if (error) return <ErrorBlock message={error} onRetry={() => void load()} />

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">
        {greeting}, {user?.name?.split(' ')[0]}
      </h1>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Comidas" value={planned} />
        <Stat label="Pendientes" value={pending} />
        <Stat label="Inventario" value={stock} />
      </div>
      <section className="rounded-2xl bg-white p-4">
        <h2 className="font-semibold">Siguiente comida</h2>
        {nextMeal ? (
          <p className="mt-2 text-lg">
            {mealLabel(nextMeal.meal_type)} · {nextMeal.recipe?.name ?? 'Receta'}
          </p>
        ) : (
          <p className="mt-2 text-stone-500">Nada planeado por ahora.</p>
        )}
      </section>
      <section className="rounded-2xl bg-amber-50 p-4">
        <h2 className="font-semibold">Te falta comprar</h2>
        {missing.length === 0 ? (
          <p className="mt-2 text-stone-600">No hay faltantes del plan.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {missing.map((item) => (
              <li key={item.id}>
                {itemName(item)} · {item.quantity} {unitLabel(item.unit)}
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="grid grid-cols-3 gap-2">
        <Link className="flex min-h-14 items-center justify-center rounded-xl bg-white font-semibold" to="/inventario">
          Inventario
        </Link>
        <Link className="flex min-h-14 items-center justify-center rounded-xl bg-white font-semibold" to="/hogar">
          Hogar
        </Link>
        <Link className="flex min-h-14 items-center justify-center rounded-xl bg-white font-semibold" to="/ajustes">
          Ajustes
        </Link>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white px-2 py-3 text-center">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  )
}
