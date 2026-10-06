import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorBlock, LoadingBlock, buttonClass, secondaryButtonClass } from '../components/ui'
import { RecipeEditor } from '../features/recipes/RecipeEditor'
import * as recipeApi from '../services/api/recipes'
import type { Recipe } from '../types'
import { errorMessage } from '../utils/errors'
import { unitLabel } from '../utils/units'

export function RecipeFormPage() {
  const { id } = useParams()
  const recipeId = id ? Number(id) : undefined
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{recipeId ? 'Editar receta' : 'Nueva receta'}</h1>
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

  if (loading) return <LoadingBlock />
  if (error || !recipe) return <ErrorBlock message={error || 'No se encontró la receta.'} />

  return (
    <article className="space-y-4">
      <h1 className="text-2xl font-semibold">{recipe.name}</h1>
      <p className="text-stone-600">{recipe.prep_minutes} min · {recipe.servings} porciones</p>
      <ul className="space-y-2 rounded-2xl bg-white p-3">
        {recipe.ingredients.map((line) => (
          <li key={line.id ?? `${line.ingredient_id}-${line.unit}`}>
            {line.ingredient?.name ?? line.name} · {line.quantity} {unitLabel(line.unit)}
            {line.is_optional ? ' (opcional)' : ''}
          </li>
        ))}
      </ul>
      <p className="whitespace-pre-wrap">{recipe.instructions}</p>
      <div className="flex gap-2">
        <Link className={buttonClass} to={`/recetas/${recipe.id}/editar`}>
          Editar
        </Link>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={() => {
            void recipeApi.deleteRecipe(recipe.id).then(() => navigate('/recetas')).catch((reason: unknown) => setError(errorMessage(reason)))
          }}
        >
          Eliminar
        </button>
      </div>
    </article>
  )
}
