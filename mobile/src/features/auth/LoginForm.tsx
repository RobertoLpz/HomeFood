import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Field } from '@/components/feedback'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { errorMessage } from '@/utils/errors'

const schema = z.object({
  email: z.email('Correo no válido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = schema.safeParse({ email, password })
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form')
        next[key] ??= issue.message
      }
      setErrors(next)
      return
    }
    setErrors({})
    setPending(true)
    setFormError('')
    try {
      await login(parsed.data.email, parsed.data.password)
      navigate('/')
    } catch (reason) {
      setFormError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
      <Field error={errors.email} label="Correo">
        <Input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </Field>
      <Field error={errors.password} label="Contraseña">
        <Input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </Field>
      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <Button className="w-full" disabled={pending} size="lg" type="submit">
        {pending ? 'Entrando…' : 'Entrar'}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        <Link className="text-primary font-semibold" to="/registro">
          Crear cuenta
        </Link>
      </p>
    </form>
  )
}
