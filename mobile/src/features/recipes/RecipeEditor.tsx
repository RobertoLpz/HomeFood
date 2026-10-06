import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Field } from '@/components/feedback'
import { IngredientPicker } from '@/components/IngredientPicker'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { notifyError, notifySuccess } from '@/lib/notify'
import * as recipeApi from '@/services/api/recipes'
import type { Difficulty, Recipe, Unit } from '@/types'
import { errorMessage } from '@/utils/errors'
import { dimensionOf, unitLabel, unitsFor } from '@/utils/units'

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
      notifySuccess(recipeId ? 'Receta actualizada' : 'Receta guardada', parsed.data.name)
    } catch (reason) {
      const message = errorMessage(reason)
      setFormError(message)
      notifyError(message)
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
      <Field error={errors.name} label="Nombre">
        <Input value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field error={errors.servings} label="Porciones">
          <Input inputMode="numeric" value={servings} onChange={(event) => setServings(event.target.value)} />
        </Field>
        <Field error={errors.prep_minutes} label="Minutos">
          <Input inputMode="numeric" value={prep} onChange={(event) => setPrep(event.target.value)} />
        </Field>
      </div>
      <Field label="Dificultad">
        <NativeSelect value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}>
          {difficulties.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field error={errors.instructions} label="Pasos">
        <Textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} />
      </Field>
      <Card>
        <CardHeader>
          <CardTitle>Ingredientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {errors.ingredients ? <p className="text-destructive text-sm">{errors.ingredients}</p> : null}
          <ul className="space-y-2">
            {lines.map((line, index) => (
              <li key={`${line.ingredient_id}-${index}`} className="flex items-center justify-between gap-2">
                <span>
                  {line.name} · {line.quantity} {unitLabel(line.unit)}
                  {line.is_optional ? ' · opcional' : ''}
                </span>
                <Button size="sm" type="button" variant="outline" onClick={() => setLines(lines.filter((_, i) => i !== index))}>
                  Quitar
                </Button>
              </li>
            ))}
          </ul>
          <IngredientPicker
            onSelect={(ingredient) => {
              setPicked({ id: ingredient.id, name: ingredient.name, unit: ingredient.default_unit })
              setDraftUnit(ingredient.default_unit)
            }}
          />
          {picked ? <p className="text-sm font-medium">Seleccionado: {picked.name}</p> : null}
          {errors.ingredient ? <p className="text-destructive text-sm">{errors.ingredient}</p> : null}
          <div className="grid grid-cols-2 gap-2">
            <Input inputMode="decimal" value={draftQty} onChange={(event) => setDraftQty(event.target.value)} />
            <NativeSelect value={draftUnit} onChange={(event) => setDraftUnit(event.target.value as Unit)}>
              {unitsFor(picked ? dimensionOf(picked.unit) : dimensionOf(draftUnit)).map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          {errors.quantity ? <p className="text-destructive text-sm">{errors.quantity}</p> : null}
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input checked={draftOptional} type="checkbox" onChange={(event) => setDraftOptional(event.target.checked)} />
            Opcional
          </label>
          <Button className="w-full" type="button" variant="secondary" onClick={addLine}>
            Agregar ingrediente
          </Button>
        </CardContent>
      </Card>
      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      {saved ? (
        <Alert variant="success">
          <AlertDescription>
            Guardado.{' '}
            <Link className="font-semibold underline" to="/recetas">
              Volver a recetas
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}
      <Button className="w-full" disabled={pending} size="lg" type="submit">
        {pending ? 'Guardando…' : 'Guardar receta'}
      </Button>
    </form>
  )
}
