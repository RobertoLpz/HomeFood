import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChefHat, Package, Users } from 'lucide-react'
import { ErrorBlock, LoadingBlock } from '@/components/feedback'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import * as inventoryApi from '@/services/api/inventory'
import * as mealApi from '@/services/api/mealPlans'
import * as shoppingApi from '@/services/api/shopping'
import type { MealPlanItem, ShoppingListItem } from '@/types'
import { isoDate, mealLabel, startOfWeek } from '@/utils/dates'
import { errorMessage } from '@/utils/errors'
import { unitLabel } from '@/utils/units'

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
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground text-sm">{greeting}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{user?.name?.split(' ')[0]}</h1>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Comidas" value={planned} />
        <Stat label="Pendientes" value={pending} />
        <Stat label="En casa" value={stock} />
      </div>
      <Card className="bg-primary text-primary-foreground border-transparent">
        <CardHeader>
          <CardDescription className="text-primary-foreground/75">Siguiente comida</CardDescription>
          <CardTitle className="text-primary-foreground text-xl">
            {nextMeal ? (nextMeal.recipe?.name ?? 'Receta') : 'Nada planeado'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nextMeal ? (
            <Badge className="bg-primary-foreground/15 text-primary-foreground">{mealLabel(nextMeal.meal_type)}</Badge>
          ) : (
            <Link className="text-sm font-semibold underline-offset-4 hover:underline" to="/plan">
              Armar el plan de la semana
            </Link>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Te falta comprar</CardTitle>
          <CardDescription>Lo que el plan todavía no cubre con lo que hay en casa.</CardDescription>
        </CardHeader>
        <CardContent>
          {missing.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay faltantes del plan.</p>
          ) : (
            <ul className="space-y-3">
              {missing.map((item) => (
                <li key={item.id} className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{itemName(item)}</span>
                  <span className="text-muted-foreground text-sm tabular-nums">
                    {item.quantity} {unitLabel(item.unit)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <div className="grid grid-cols-3 gap-3">
        <Shortcut icon={Package} label="Inventario" to="/inventario" />
        <Shortcut icon={Users} label="Hogar" to="/hogar" />
        <Shortcut icon={ChefHat} label="Ingredientes" to="/ingredientes" />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="gap-1 px-2 py-4 text-center shadow-none">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </Card>
  )
}

function Shortcut({ icon: Icon, label, to }: { icon: typeof Package; label: string; to: string }) {
  return (
    <Link className="bg-card flex min-h-20 flex-col items-center justify-center gap-2 rounded-3xl border text-sm font-semibold" to={to}>
      <Icon className="text-primary size-5" />
      {label}
    </Link>
  )
}
