import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyBlock, ErrorBlock, LoadingBlock, PageTitle } from '@/components/feedback'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { notifyError, notifySuccess } from '@/lib/notify'
import * as recipeApi from '@/services/api/recipes'
import type { Recipe } from '@/types'
import { errorMessage } from '@/utils/errors'

const difficultyLabel: Record<Recipe['difficulty'], string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
}

export function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingId, setPendingId] = useState<number | null>(null)

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
    setPendingId(recipe.id)
    try {
      if (recipe.is_favorite) {
        await recipeApi.unfavoriteRecipe(recipe.id)
        notifySuccess('Quitada de favoritos')
      } else {
        await recipeApi.favoriteRecipe(recipe.id)
        notifySuccess('Guardada en favoritos', recipe.name)
      }
      await load()
    } catch (reason) {
      notifyError(errorMessage(reason))
    } finally {
      setPendingId(null)
    }
  }

  if (loading) return <LoadingBlock />

  return (
    <div className="space-y-4">
      <PageTitle
        action={
          <Button asChild>
            <Link to="/recetas/nueva">Nueva</Link>
          </Button>
        }
        hint="Las que cocinan en este hogar."
        title="Recetas"
      />
      {error ? <ErrorBlock message={error} onRetry={() => void load()} /> : null}
      {recipes.length === 0 ? (
        <EmptyBlock
          action={
            <Button asChild>
              <Link to="/recetas/nueva">Crear la primera</Link>
            </Button>
          }
          hint="Crea la primera para planear la semana."
          title="Sin recetas"
        />
      ) : null}
      <ul className="space-y-3">
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <Card className="gap-3 py-4">
              <CardContent className="space-y-3 px-4">
                <Link className="block" to={`/recetas/${recipe.id}`}>
                  <p className="text-lg font-semibold">{recipe.name}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {recipe.servings} porciones · {recipe.prep_minutes} min
                  </p>
                </Link>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">{difficultyLabel[recipe.difficulty] ?? recipe.difficulty}</Badge>
                  <Button
                    disabled={pendingId === recipe.id}
                    size="sm"
                    type="button"
                    variant={recipe.is_favorite ? 'default' : 'outline'}
                    onClick={() => void toggleFavorite(recipe)}
                  >
                    <Star className={recipe.is_favorite ? 'fill-current' : ''} />
                    {recipe.is_favorite ? 'Favorita' : 'Favorito'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
