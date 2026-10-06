import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useHousehold } from '../context/HouseholdContext'

const links = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/recetas', label: 'Recetas', end: false },
  { to: '/plan', label: 'Plan', end: false },
  { to: '/compras', label: 'Compras', end: false },
]

export function AppShell() {
  const { current } = useHousehold()
  const location = useLocation()

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col bg-stone-100">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-emerald-900 px-4 py-3 text-white">
        <p className="text-xs uppercase tracking-wide text-emerald-100">HomeFood</p>
        <p className="text-lg font-semibold">{current?.name ?? 'Sin hogar'}</p>
      </header>
      <main className="flex-1 px-4 py-4 pb-28">
        <Outlet key={`${current?.id ?? 'none'}-${location.pathname}`} />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto grid max-w-lg grid-cols-4 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)]">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex min-h-16 items-center justify-center text-sm font-semibold ${
                isActive ? 'text-emerald-800' : 'text-stone-500'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
