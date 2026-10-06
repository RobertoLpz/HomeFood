import { useEffect, useState, type FormEvent } from 'react'
import { z } from 'zod'
import { Field, PageTitle } from '@/components/feedback'
import { IngredientPicker } from '@/components/IngredientPicker'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { notifyError, notifySuccess } from '@/lib/notify'
import * as ingredientApi from '@/services/api/ingredients'
import type { Dimension, Unit } from '@/types'
import { errorMessage } from '@/utils/errors'
import { DIMENSIONS, unitsFor } from '@/utils/units'

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
  const [pending, setPending] = useState(false)

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
    setPending(true)
    setError('')
    try {
      await ingredientApi.createIngredient(parsed.data)
      setName('')
      notifySuccess('Ingrediente creado', parsed.data.name)
    } catch (reason) {
      const message = errorMessage(reason)
      setError(message)
      notifyError(message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle hint="Busca antes de crear uno nuevo para este hogar." title="Ingredientes" />
      <Card>
        <CardHeader>
          <CardTitle>¿Ya existe?</CardTitle>
        </CardHeader>
        <CardContent>
          <IngredientPicker onSelect={(ingredient) => notifySuccess('Ese ingrediente ya existe', ingredient.name)} />
        </CardContent>
      </Card>
      <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
        <Field label="Nombre">
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Tipo">
          <NativeSelect value={dimension} onChange={(event) => setDimension(event.target.value as Dimension)}>
            {DIMENSIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Unidad base">
          <NativeSelect value={unit} onChange={(event) => setUnit(event.target.value as Unit)}>
            {unitsFor(dimension).map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? 'Guardando…' : 'Crear ingrediente'}
        </Button>
      </form>
    </div>
  )
}
