import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Field, buttonClass, inputClass } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { errorMessage } from '../../utils/errors'

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
      <Field label="Nombre" error={errors.name}>
        <input className={inputClass} value={values.name} onChange={(event) => update('name', event.target.value)} />
      </Field>
      <Field label="Correo" error={errors.email}>
        <input className={inputClass} type="email" autoComplete="email" value={values.email} onChange={(event) => update('email', event.target.value)} />
      </Field>
      <Field label="Contraseña" error={errors.password}>
        <input className={inputClass} type="password" autoComplete="new-password" value={values.password} onChange={(event) => update('password', event.target.value)} />
      </Field>
      <Field label="Confirmar" error={errors.password_confirmation}>
        <input className={inputClass} type="password" value={values.password_confirmation} onChange={(event) => update('password_confirmation', event.target.value)} />
      </Field>
      {formError ? <p className="text-sm text-red-700">{formError}</p> : null}
      <button className={`${buttonClass} w-full`} disabled={pending} type="submit">
        {pending ? 'Creando…' : 'Registrarme'}
      </button>
      <p className="text-center text-sm">
        <Link className="font-semibold text-emerald-800" to="/login">
          Ya tengo cuenta
        </Link>
      </p>
    </form>
  )
}
