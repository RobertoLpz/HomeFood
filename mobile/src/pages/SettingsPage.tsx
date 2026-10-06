import { Link } from 'react-router-dom'
import { secondaryButtonClass } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export function SettingsPage() {
  const { user, logout } = useAuth()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Ajustes</h1>
      <p className="rounded-2xl bg-white p-4">
        {user?.name}
        <span className="mt-1 block text-stone-500">{user?.email}</span>
      </p>
      <Link className={`${secondaryButtonClass} w-full`} to="/ingredientes">
        Ingredientes
      </Link>
      <Link className={`${secondaryButtonClass} w-full`} to="/hogar">
        Hogar
      </Link>
      <button type="button" className="min-h-12 w-full rounded-xl bg-stone-800 font-semibold text-white" onClick={() => void logout()}>
        Cerrar sesión
      </button>
    </div>
  )
}
