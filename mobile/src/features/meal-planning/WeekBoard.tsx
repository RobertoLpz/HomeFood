import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { z } from 'zod'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ErrorBlock, Field, LoadingBlock, PageTitle } from '@/components/feedback'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { notifyError, notifySuccess } from '@/lib/notify'
import * as mealApi from '@/services/api/mealPlans'
import * as recipeApi from '@/services/api/recipes'
import type { MealPlan, MealPlanItem, MealType, Recipe } from '@/types'
import { MEAL_TYPES, formatDay, mealLabel, shiftWeek, startOfWeek, weekDays } from '@/utils/dates'
import { errorMessage } from '@/utils/errors'

const schema = z.object({
  recipe_id: z.number().int().positive('Elige una receta'),
  servings: z.number().int().positive('Porciones mayores a 0'),
})

export function WeekBoard() {
  const [week, setWeek] = useState(startOfWeek())
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)
  const [slot, setSlot] = useState<{ date: string; meal: MealType } | null>(null)
  const [removing, setRemoving] = useState<MealPlanItem | null>(null)
  const [recipeId, setRecipeId] = useState('')
  const [servings, setServings] = useState('2')

  async function load(target = week) {
    setLoading(true)
    setError('')
    try {
      const [nextPlan, nextRecipes] = await Promise.all([mealApi.getMealPlan(target), recipeApi.listRecipes()])
      setPlan(nextPlan)
      setRecipes(nextRecipes)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(week)
  }, [week])

  async function onAdd(event: FormEvent) {
    event.preventDefault()
    if (!plan || !slot) return
    const parsed = schema.safeParse({ recipe_id: Number(recipeId), servings: Number(servings) })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Revisa el formulario')
      return
    }
    setPending(true)
    setFormError('')
    try {
      await mealApi.addMealPlanItem(plan.id, {
        recipe_id: parsed.data.recipe_id,
        planned_on: slot.date,
        meal_type: slot.meal,
        servings: parsed.data.servings,
      })
      notifySuccess('Comida planeada', mealLabel(slot.meal))
      setSlot(null)
      setRecipeId('')
      await load(week)
    } catch (reason) {
      const message = errorMessage(reason)
      setFormError(message)
      notifyError(message)
    } finally {
      setPending(false)
    }
  }

  async function cook(item: MealPlanItem) {
    setPending(true)
    try {
      await mealApi.cookMealPlanItem(item.id)
      notifySuccess('Lista para la mesa', item.recipe?.name ?? 'Comida cocinada')
      await load(week)
    } catch (reason) {
      notifyError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  async function removeItem() {
    if (!removing) return
    setPending(true)
    try {
      await mealApi.deleteMealPlanItem(removing.id)
      notifySuccess('Quitada del plan')
      setRemoving(null)
      await load(week)
    } catch (reason) {
      notifyError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  if (loading && !plan) return <LoadingBlock />

  return (
    <div className="space-y-4">
      <PageTitle hint="Toca un espacio libre para elegir receta." title="Plan semanal" />
      <div className="flex items-center justify-between gap-2">
        <Button aria-label="Semana anterior" size="icon" type="button" variant="outline" onClick={() => setWeek(shiftWeek(week, -1))}>
          <ChevronLeft />
        </Button>
        <p className="text-sm font-semibold tabular-nums">Semana {week}</p>
        <Button aria-label="Semana siguiente" size="icon" type="button" variant="outline" onClick={() => setWeek(shiftWeek(week, 1))}>
          <ChevronRight />
        </Button>
      </div>
      {error ? <ErrorBlock message={error} onRetry={() => void load(week)} /> : null}
      {weekDays(week).map((date) => (
        <Card key={date} className="gap-3 py-4">
          <CardHeader className="px-4">
            <CardTitle className="capitalize">{formatDay(date)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4">
            {MEAL_TYPES.map((meal) => {
              const item = plan?.items.find((entry) => entry.planned_on === date && entry.meal_type === meal.value)
              return (
                <div key={meal.value} className="flex min-h-14 items-center justify-between gap-3 border-t pt-3 first:border-t-0 first:pt-0">
                  <div>
                    <p className="text-muted-foreground text-sm">{meal.label}</p>
                    <p className="font-medium">{item ? (item.recipe?.name ?? `Receta ${item.recipe_id}`) : 'Libre'}</p>
                    {item?.cooked_at ? <p className="text-primary text-xs font-medium">Cocinada</p> : null}
                  </div>
                  {item ? (
                    <div className="flex gap-2">
                      {!item.cooked_at ? (
                        <Button disabled={pending} size="sm" type="button" onClick={() => void cook(item)}>
                          Cocinar
                        </Button>
                      ) : null}
                      <Button size="sm" type="button" variant="outline" onClick={() => setRemoving(item)}>
                        Quitar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setFormError('')
                        setSlot({ date, meal: meal.value })
                      }}
                    >
                      Añadir
                    </Button>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}

      <Dialog
        open={slot !== null}
        onOpenChange={(next) => {
          if (!next) setSlot(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{slot ? `${mealLabel(slot.meal)} · ${formatDay(slot.date)}` : 'Planear'}</DialogTitle>
            <DialogDescription>Elige la receta y cuántas porciones vas a preparar.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void onAdd(event)}>
            <Field label="Receta">
              <NativeSelect value={recipeId} onChange={(event) => setRecipeId(event.target.value)}>
                <option value="">Elige receta</option>
                {recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Porciones">
              <Input inputMode="numeric" value={servings} onChange={(event) => setServings(event.target.value)} />
            </Field>
            {formError ? (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
            <DialogFooter>
              <Button disabled={pending} type="submit">
                {pending ? 'Guardando…' : 'Planear comida'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        confirmLabel="Quitar"
        description="Esta comida saldrá del plan de la semana."
        destructive
        open={removing !== null}
        pending={pending}
        title="Quitar del plan"
        onConfirm={() => void removeItem()}
        onOpenChange={(next) => {
          if (!next) setRemoving(null)
        }}
      />
    </div>
  )
}
