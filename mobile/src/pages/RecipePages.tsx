import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ErrorBlock, LoadingBlock, PageTitle } from '@/components/feedback'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RecipeEditor } from '@/features/recipes/RecipeEditor'
import { notifyError, notifySuccess } from '@/lib/notify'
import * as recipeApi from '@/services/api/recipes'
import type { Recipe } from '@/types'
import { errorMessage } from '@/utils/errors'
import { unitLabel } from '@/utils/units'

export function RecipeFormPage() {
  const { id } = useParams()
  const recipeId = id ? Number(id) : undefined
  return (
    <div className="space-y-4">
      <PageTitle title={recipeId ? 'Editar receta' : 'Nueva receta'} />
      <RecipeEditor recipeId={recipeId} />
    </div>
  )
}

export function RecipeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let active = true
    void recipeApi
      .getRecipe(Number(id))
      .then((data) => {
        if (active) setRecipe(data)
      })
      .catch((reason: unknown) => {
        if (active) setError(errorMessage(reason))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  async function remove() {
    if (!recipe) return
    setPending(true)
    try {
      await recipeApi.deleteRecipe(recipe.id)
      notifySuccess('Receta eliminada')
      navigate('/recetas')
    } catch (reason) {
      notifyError(errorMessage(reason))
      setPending(false)
    }
  }

  if (loading) return <LoadingBlock />
  if (error || !recipe) return <ErrorBlock message={error || 'No se encontró la receta.'} />

  return (
    <article className="space-y-4">
      <PageTitle hint={`${recipe.prep_minutes} min · ${recipe.servings} porciones`} title={recipe.name} />
      <Card>
        <CardContent>
          <ul className="space-y-3">
            {recipe.ingredients.map((line) => (
              <li key={line.id ?? `${line.ingredient_id}-${line.unit}`} className="flex items-baseline justify-between gap-3">
                <span className="font-medium">
                  {line.ingredient?.name ?? line.name}
                  {line.is_optional ? <span className="text-muted-foreground font-normal"> · opcional</span> : null}
                </span>
                <span className="text-muted-foreground text-sm tabular-nums">
                  {line.quantity} {unitLabel(line.unit)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <p className="whitespace-pre-wrap leading-relaxed">{recipe.instructions}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button asChild>
          <Link to={`/recetas/${recipe.id}/editar`}>Editar</Link>
        </Button>
        <Button type="button" variant="outline" onClick={() => setConfirmDelete(true)}>
          Eliminar
        </Button>
      </div>
      <ConfirmDialog
        confirmLabel="Eliminar"
        description={`Se borrará “${recipe.name}” de este hogar.`}
        destructive
        open={confirmDelete}
        pending={pending}
        title="Eliminar receta"
        onConfirm={() => void remove()}
        onOpenChange={setConfirmDelete}
      />
    </article>
  )
}
