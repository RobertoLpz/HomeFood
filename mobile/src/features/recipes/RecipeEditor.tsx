import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { IngredientPicker } from '../../components/IngredientPicker'
import { ErrorBlock, Field, buttonClass, inputClass, secondaryButtonClass } from '../../components/ui'
import * as recipeApi from '../../services/api/recipes'
import type { Difficulty, Recipe, Unit } from '../../types'
import { errorMessage } from '../../utils/errors'
import { unitLabel, unitsFor, dimensionOf } from '../../utils/units'

const difficulties: Array<{ value: Difficulty; label: string }> = [
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Media' },
  { value: 'hard', label: 'Difícil' },
]

const schema = z.object({
  name: z.string().trim().min(2, 'Nombre muy corto'),
  servings: z.number().int().positive('Porciones mayores a 0'),
  prep_minutes: z.number().int().min(0, 'Minutos no válidos'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  instructions: z.string().trim().min(1, 'Escribe los pasos'),
  ingredients: z
    .array(
      z.object({
        ingredient_id: z.number().int().positive(),
        name: z.string(),
        quantity: z.number().positive('Cantidad mayor a 0'),
        unit: z.enum(['piece', 'g', 'kg', 'ml', 'l']),
        is_optional: z.boolean(),
      }),
    )
    .min(1, 'Agrega un ingrediente'),
})

type Line = z.infer<typeof schema>['ingredients'][number]

export function RecipeEditor({ recipeId }: { recipeId?: number }) {
  const [name, setName] = useState('')
  const [servings, setServings] = useState('2')
  const [prep, setPrep] = useState('20')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [instructions, setInstructions] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [draftQty, setDraftQty] = useState('1')
  const [draftUnit, setDraftUnit] = useState<Unit>('piece')
  const [draftOptional, setDraftOptional] = useState(false)
  const [picked, setPicked] = useState<{ id: number; name: string; unit: Unit } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!recipeId) return
    let active = true
    void recipeApi
      .getRecipe(recipeId)
      .then((recipe) => {
        if (!active) return
        fill(recipe)
      })
      .catch((reason: unknown) => {
        if (active) setFormError(errorMessage(reason))
      })
    return () => {
      active = false
    }
  }, [recipeId])

  function fill(recipe: Recipe) {
    setName(recipe.name)
    setServings(String(recipe.servings))
    setPrep(String(recipe.prep_minutes))
    setDifficulty(recipe.difficulty)
    setInstructions(recipe.instructions)
    setLines(
      recipe.ingredients.map((line) => ({
        ingredient_id: line.ingredient_id,
        name: line.ingredient?.name ?? line.name ?? 'Ingrediente',
        quantity: Number(line.quantity),
        unit: line.unit,
        is_optional: line.is_optional,
      })),
    )
  }

  function addLine() {
    if (!picked) {
      setErrors({ ingredient: 'Elige un ingrediente' })
      return
    }
    const quantity = Number(draftQty)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setErrors({ quantity: 'Cantidad mayor a 0' })
      return
    }
    setLines((current) => [
      ...current,
      {
        ingredient_id: picked.id,
        name: picked.name,
        quantity,
        unit: draftUnit,
        is_optional: draftOptional,
      },
    ])
    setPicked(null)
    setErrors({})
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = schema.safeParse({
      name,
      servings: Number(servings),
      prep_minutes: Number(prep),
      difficulty,
      instructions,
      ingredients: lines,
    })
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        next[String(issue.path[0] ?? 'form')] ??= issue.message
      }
      setErrors(next)
      return
    }
    setPending(true)
    setFormError('')
    const payload = {
      name: parsed.data.name,
      servings: parsed.data.servings,
      prep_minutes: parsed.data.prep_minutes,
      difficulty: parsed.data.difficulty,
      instructions: parsed.data.instructions,
      description: null,
      ingredients: parsed.data.ingredients.map((line) => ({
        ingredient_id: line.ingredient_id,
        quantity: line.quantity,
        unit: line.unit,
        is_optional: line.is_optional,
      })),
    }
    try {
      if (recipeId) await recipeApi.updateRecipe(recipeId, payload)
      else await recipeApi.createRecipe(payload)
      setSaved(true)
    } catch (reason) {
      setFormError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
      <Field label="Nombre" error={errors.name}>
        <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Porciones" error={errors.servings}>
          <input className={inputClass} inputMode="numeric" value={servings} onChange={(event) => setServings(event.target.value)} />
        </Field>
        <Field label="Minutos" error={errors.prep_minutes}>
          <input className={inputClass} inputMode="numeric" value={prep} onChange={(event) => setPrep(event.target.value)} />
        </Field>
      </div>
      <Field label="Dificultad">
        <select className={inputClass} value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}>
          {difficulties.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Pasos" error={errors.instructions}>
        <textarea className={`${inputClass} min-h-28 py-3`} value={instructions} onChange={(event) => setInstructions(event.target.value)} />
      </Field>
      <div className="space-y-3 rounded-2xl bg-white p-3">
        <p className="font-medium">Ingredientes</p>
        {errors.ingredients ? <p className="text-sm text-red-700">{errors.ingredients}</p> : null}
        <ul className="space-y-2">
          {lines.map((line, index) => (
            <li key={`${line.ingredient_id}-${index}`} className="flex items-center justify-between gap-2">
              <span>
                {line.name} · {line.quantity} {unitLabel(line.unit)}
                {line.is_optional ? ' · opcional' : ''}
              </span>
              <button type="button" className="min-h-11 text-sm text-red-700" onClick={() => setLines(lines.filter((_, i) => i !== index))}>
                Quitar
              </button>
            </li>
          ))}
        </ul>
        <IngredientPicker
          onSelect={(ingredient) => {
            setPicked({ id: ingredient.id, name: ingredient.name, unit: ingredient.default_unit })
            setDraftUnit(ingredient.default_unit)
          }}
        />
        {picked ? <p className="text-sm">Seleccionado: {picked.name}</p> : null}
        {errors.ingredient ? <p className="text-sm text-red-700">{errors.ingredient}</p> : null}
        <div className="grid grid-cols-2 gap-2">
          <input className={inputClass} inputMode="decimal" value={draftQty} onChange={(event) => setDraftQty(event.target.value)} />
          <select className={inputClass} value={draftUnit} onChange={(event) => setDraftUnit(event.target.value as Unit)}>
            {unitsFor(picked ? dimensionOf(picked.unit) : dimensionOf(draftUnit)).map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>
        {errors.quantity ? <p className="text-sm text-red-700">{errors.quantity}</p> : null}
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" checked={draftOptional} onChange={(event) => setDraftOptional(event.target.checked)} />
          Opcional
        </label>
        <button type="button" className={`${secondaryButtonClass} w-full`} onClick={addLine}>
          Agregar ingrediente
        </button>
      </div>
      {formError ? <ErrorBlock message={formError} /> : null}
      {saved ? (
        <p className="text-emerald-800">
          Guardado. <Link className="font-semibold underline" to="/recetas">Volver</Link>
        </p>
      ) : null}
      <button className={`${buttonClass} w-full`} disabled={pending} type="submit">
        {pending ? 'Guardando…' : 'Guardar receta'}
      </button>
    </form>
  )
}
