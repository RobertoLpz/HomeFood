import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { LoadingBlock } from '@/components/feedback'
import { useAuth } from './context/AuthContext'
import { useHousehold } from './context/HouseholdContext'
import { AppShell } from './layouts/AppShell'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { DashboardPage } from './pages/DashboardPage'
import { RecipeDetailPage, RecipeFormPage } from './pages/RecipePages'
import { RecipesPage } from './pages/RecipesPage'
import { ShoppingListsPage } from './pages/ShoppingListsPage'
import { HouseholdManager } from './features/household/HouseholdManager'
import { IngredientCreator } from './features/inventory/IngredientCreator'
import { InventoryPanel } from './features/inventory/InventoryPanel'
import { WeekBoard } from './features/meal-planning/WeekBoard'
import { ShoppingBoard } from './features/shopping/ShoppingBoard'
import { SettingsPage } from './pages/SettingsPage'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <LoadingBlock />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

function RequireHousehold({ children }: { children: ReactNode }) {
  const { current, ready } = useHousehold()
  const location = useLocation()
  if (!ready) return <LoadingBlock />
  const open = location.pathname === '/hogar' || location.pathname === '/ajustes'
  if (!current && !open) return <Navigate to="/hogar" replace />
  return children
}

function ShoppingRoute() {
  const { id } = useParams()
  return <ShoppingBoard listId={Number(id)} />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route
        element={
          <RequireAuth>
            <RequireHousehold>
              <AppShell />
            </RequireHousehold>
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="recetas" element={<RecipesPage />} />
        <Route path="recetas/nueva" element={<RecipeFormPage />} />
        <Route path="recetas/:id" element={<RecipeDetailPage />} />
        <Route path="recetas/:id/editar" element={<RecipeFormPage />} />
        <Route path="plan" element={<WeekBoard />} />
        <Route path="compras" element={<ShoppingListsPage />} />
        <Route path="compras/:id" element={<ShoppingRoute />} />
        <Route path="inventario" element={<InventoryPanel />} />
        <Route path="ingredientes" element={<IngredientCreator />} />
        <Route path="hogar" element={<HouseholdManager />} />
        <Route path="ajustes" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
