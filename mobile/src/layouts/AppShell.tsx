import { CalendarDays, Home, Settings, ShoppingCart, UtensilsCrossed } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useHousehold } from '@/context/HouseholdContext'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Inicio', end: true, icon: Home },
  { to: '/recetas', label: 'Recetas', end: false, icon: UtensilsCrossed },
  { to: '/plan', label: 'Plan', end: false, icon: CalendarDays },
  { to: '/compras', label: 'Compras', end: false, icon: ShoppingCart },
]

export function AppShell() {
  const { current } = useHousehold()
  const location = useLocation()

  return (
    <div className="bg-background mx-auto flex min-h-svh max-w-lg flex-col">
      <header className="bg-background/85 sticky top-0 z-20 border-b px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-primary text-xs font-semibold tracking-wide">HomeFood</p>
            <p className="text-lg font-semibold">{current?.name ?? 'Sin hogar'}</p>
          </div>
          <Button asChild size="icon" variant="ghost">
            <NavLink aria-label="Ajustes" to="/ajustes">
              <Settings />
            </NavLink>
          </Button>
        </div>
      </header>
      <main className="flex-1 px-4 py-6 pb-28">
        <Outlet key={`${current?.id ?? 'none'}-${location.pathname}`} />
      </main>
      <nav className="bg-background/95 fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg border-t pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="grid grid-cols-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
              end={link.end}
              to={link.to}
            >
              <link.icon className="size-5" />
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
