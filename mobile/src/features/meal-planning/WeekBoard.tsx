import { useEffect, useState, type FormEvent } from 'react'
import { z } from 'zod'
import { ErrorBlock, LoadingBlock, buttonClass, inputClass, secondaryButtonClass } from '../../components/ui'
import * as mealApi from '../../services/api/mealPlans'
import * as recipeApi from '../../services/api/recipes'
import type { MealPlan, MealType, Recipe } from '../../types'
import { MEAL_TYPES, formatDay, mealLabel, shiftWeek, startOfWeek, weekDays } from '../../utils/dates'
import { errorMessage } from '../../utils/errors'

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
  const [slot, setSlot] = useState<{ date: string; meal: MealType } | null>(null)
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
      setError(parsed.error.issues[0]?.message ?? 'Revisa el formulario')
      return
    }
    try {
      await mealApi.addMealPlanItem(plan.id, {
        recipe_id: parsed.data.recipe_id,
        planned_on: slot.date,
        meal_type: slot.meal,
        servings: parsed.data.servings,
      })
      setSlot(null)
      await load(week)
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }

  if (loading && !plan) return <LoadingBlock />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button type="button" className={secondaryButtonClass} onClick={() => setWeek(shiftWeek(week, -1))}>
          Anterior
        </button>
        <p className="text-sm font-semibold">Semana {week}</p>
        <button type="button" className={secondaryButtonClass} onClick={() => setWeek(shiftWeek(week, 1))}>
          Siguiente
        </button>
      </div>
      {error ? <ErrorBlock message={error} onRetry={() => void load(week)} /> : null}
      {weekDays(week).map((date) => (
        <section key={date} className="rounded-2xl bg-white p-3">
          <h2 className="font-semibold capitalize">{formatDay(date)}</h2>
          <ul className="mt-2 space-y-2">
            {MEAL_TYPES.map((meal) => {
              const item = plan?.items.find((entry) => entry.planned_on === date && entry.meal_type === meal.value)
              return (
                <li key={meal.value} className="flex min-h-14 items-center justify-between gap-2 border-t border-stone-100 pt-2">
                  <div>
                    <p className="text-sm text-stone-500">{meal.label}</p>
                    <p>{item ? (item.recipe?.name ?? `Receta ${item.recipe_id}`) : 'Libre'}</p>
                    {item?.cooked_at ? <p className="text-xs text-emerald-800">Cocinada</p> : null}
                  </div>
                  {item ? (
                    <div className="flex gap-2">
                      {!item.cooked_at ? (
                        <button type="button" className="min-h-11 px-2 text-sm font-semibold text-emerald-800" onClick={() => void mealApi.cookMealPlanItem(item.id).then(() => load(week)).catch((reason: unknown) => setError(errorMessage(reason)))}>
                          Cocinar
                        </button>
                      ) : null}
                      <button type="button" className="min-h-11 px-2 text-sm text-red-700" onClick={() => void mealApi.deleteMealPlanItem(item.id).then(() => load(week)).catch((reason: unknown) => setError(errorMessage(reason)))}>
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="min-h-11 font-semibold text-emerald-800" onClick={() => setSlot({ date, meal: meal.value })}>
                      Añadir
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      {slot ? (
        <form className="space-y-3 rounded-2xl bg-white p-3" onSubmit={(event) => void onAdd(event)}>
          <p className="font-semibold">
            {mealLabel(slot.meal)} · {formatDay(slot.date)}
          </p>
          <select className={inputClass} value={recipeId} onChange={(event) => setRecipeId(event.target.value)}>
            <option value="">Elige receta</option>
            {recipes.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.name}
              </option>
            ))}
          </select>
          <input className={inputClass} inputMode="numeric" value={servings} onChange={(event) => setServings(event.target.value)} />
          <button className={`${buttonClass} w-full`} type="submit">
            Planear
          </button>
        </form>
      ) : null}
    </div>
  )
}
