import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { EmptyBlock, Field, PageTitle } from '@/components/feedback'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useHousehold } from '@/context/HouseholdContext'
import { notifyError, notifySuccess } from '@/lib/notify'
import { errorMessage } from '@/utils/errors'

const nameSchema = z.object({ name: z.string().trim().min(2, 'El nombre es muy corto') })
const emailSchema = z.object({ email: z.email('Correo no válido') })

export function HouseholdManager() {
  const { households, current, members, select, create, addMember } = useHousehold()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    const parsed = nameSchema.safeParse({ name })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa el nombre')
      return
    }
    setPending(true)
    setError('')
    try {
      await create(parsed.data.name)
      setName('')
      setCreateOpen(false)
      notifySuccess('Hogar creado', parsed.data.name)
    } catch (reason) {
      const message = errorMessage(reason)
      setError(message)
      notifyError(message)
    } finally {
      setPending(false)
    }
  }

  async function onInvite(event: FormEvent) {
    event.preventDefault()
    const parsed = emailSchema.safeParse({ email })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa el correo')
      return
    }
    setPending(true)
    setError('')
    try {
      await addMember(parsed.data.email)
      setEmail('')
      setInviteOpen(false)
      notifySuccess('Miembro agregado', parsed.data.email)
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
      <PageTitle
        action={
          <Button type="button" onClick={() => { setError(''); setCreateOpen(true) }}>
            Nuevo
          </Button>
        }
        hint="Cambia de hogar o invita a quien cocina contigo."
        title="Hogar"
      />
      {households.length === 0 ? <EmptyBlock hint="Crea el primero para guardar recetas e inventario." title="Aún no perteneces a un hogar" /> : null}
      <div className="space-y-2">
        {households.map((household) => {
          const active = household.id === current?.id
          return (
            <Button
              key={household.id}
              className="w-full justify-between"
              type="button"
              variant={active ? 'default' : 'outline'}
              onClick={() => void select(household.id)}
            >
              <span>{household.name}</span>
              {household.role ? (
                <span className="text-sm font-medium opacity-80">{household.role === 'owner' ? 'Dueño' : 'Miembro'}</span>
              ) : null}
            </Button>
          )
        })}
      </div>
      {current ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Miembros</CardTitle>
            <Button size="sm" type="button" variant="secondary" onClick={() => { setError(''); setInviteOpen(true) }}>
              Invitar
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {members.length === 0 ? <p className="text-muted-foreground text-sm">Todavía no hay miembros.</p> : null}
            {members.map((member) => (
              <div key={member.id} className="bg-muted rounded-2xl px-3 py-3">
                <p className="font-medium">{member.name}</p>
                <p className="text-muted-foreground text-sm">{member.email}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo hogar</DialogTitle>
            <DialogDescription>Un hogar agrupa recetas, despensa y compras.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void onCreate(event)}>
            <Field label="Nombre">
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            {error && createOpen ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <DialogFooter>
              <Button disabled={pending} type="submit">
                {pending ? 'Guardando…' : 'Crear hogar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar miembro</DialogTitle>
            <DialogDescription>Usa el correo de una cuenta que ya esté registrada.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void onInvite(event)}>
            <Field label="Correo">
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </Field>
            {error && inviteOpen ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <DialogFooter>
              <Button disabled={pending} type="submit">
                {pending ? 'Guardando…' : 'Invitar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
