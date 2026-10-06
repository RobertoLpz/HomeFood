import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Field } from '@/components/feedback'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { errorMessage } from '@/utils/errors'

const schema = z
  .object({
    name: z.string().trim().min(2, 'Escribe tu nombre'),
    email: z.email('Correo no válido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    password_confirmation: z.string().min(8, 'Confirma la contraseña'),
  })
  .refine((value) => value.password === value.password_confirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['password_confirmation'],
  })

export function RegisterForm() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)

  function update(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        next[String(issue.path[0] ?? 'form')] ??= issue.message
      }
      setErrors(next)
      return
    }
    setErrors({})
    setPending(true)
    setFormError('')
    try {
      await register(parsed.data.name, parsed.data.email, parsed.data.password, parsed.data.password_confirmation)
      navigate('/')
    } catch (reason) {
      setFormError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
      <Field error={errors.name} label="Nombre">
        <Input value={values.name} onChange={(event) => update('name', event.target.value)} />
      </Field>
      <Field error={errors.email} label="Correo">
        <Input autoComplete="email" type="email" value={values.email} onChange={(event) => update('email', event.target.value)} />
      </Field>
      <Field error={errors.password} label="Contraseña">
        <Input autoComplete="new-password" type="password" value={values.password} onChange={(event) => update('password', event.target.value)} />
      </Field>
      <Field error={errors.password_confirmation} label="Confirmar">
        <Input type="password" value={values.password_confirmation} onChange={(event) => update('password_confirmation', event.target.value)} />
      </Field>
      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <Button className="w-full" disabled={pending} size="lg" type="submit">
        {pending ? 'Creando…' : 'Registrarme'}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        <Link className="text-primary font-semibold" to="/login">
          Ya tengo cuenta
        </Link>
      </p>
    </form>
  )
}
