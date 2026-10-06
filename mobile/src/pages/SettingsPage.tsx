import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageTitle } from '@/components/feedback'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'

export function SettingsPage() {
  const { user, logout } = useAuth()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [pending, setPending] = useState(false)

  async function onLogout() {
    setPending(true)
    try {
      await logout()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageTitle title="Ajustes" />
      <Card>
        <CardContent>
          <p className="text-lg font-semibold">{user?.name}</p>
          <p className="text-muted-foreground mt-1 text-sm">{user?.email}</p>
        </CardContent>
      </Card>
      <Button asChild className="w-full" variant="outline">
        <Link to="/ingredientes">Ingredientes</Link>
      </Button>
      <Button asChild className="w-full" variant="outline">
        <Link to="/hogar">Hogar</Link>
      </Button>
      <Button className="w-full" type="button" variant="secondary" onClick={() => setConfirmLogout(true)}>
        Cerrar sesión
      </Button>
      <ConfirmDialog
        confirmLabel="Cerrar sesión"
        description="Tendrás que volver a entrar para ver el hogar."
        open={confirmLogout}
        pending={pending}
        title="¿Salir de HomeFood?"
        onConfirm={() => void onLogout()}
        onOpenChange={setConfirmLogout}
      />
    </div>
  )
}
