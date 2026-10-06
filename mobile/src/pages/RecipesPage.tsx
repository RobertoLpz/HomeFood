import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyBlock, ErrorBlock, LoadingBlock, buttonClass } from '../components/ui'
import * as recipeApi from '../services/api/recipes'
import type { Recipe } from '../types'
import { errorMessage } from '../utils/errors'

const difficultyLabel: Record<Recipe['difficulty'], string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
}

export function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      setRecipes(await recipeApi.listRecipes())
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function toggleFavorite(recipe: Recipe) {
    try {
      if (recipe.is_favorite) await recipeApi.unfavoriteRecipe(recipe.id)
      else await recipeApi.favoriteRecipe(recipe.id)
      await load()
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }

  if (loading) return <LoadingBlock />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Recetas</h1>
        <Link className={buttonClass} to="/recetas/nueva">
          Nueva
        </Link>
      </div>
      {error ? <ErrorBlock message={error} onRetry={() => void load()} /> : null}
      {recipes.length === 0 ? <EmptyBlock title="Sin recetas" hint="Crea la primera para planear la semana." /> : null}
      <ul className="space-y-3">
        {recipes.map((recipe) => (
          <li key={recipe.id} className="rounded-2xl bg-white p-3">
            <Link className="block min-h-12" to={`/recetas/${recipe.id}`}>
              <p className="text-lg font-semibold">{recipe.name}</p>
              <p className="text-sm text-stone-500">
                {recipe.servings} porciones · {difficultyLabel[recipe.difficulty] ?? recipe.difficulty}
              </p>
            </Link>
            <button type="button" className="min-h-11 font-semibold text-amber-700" onClick={() => void toggleFavorite(recipe)}>
              {recipe.is_favorite ? 'Quitar favorito' : 'Favorito'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
