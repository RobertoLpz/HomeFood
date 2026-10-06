import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { ErrorBlock, Field, buttonClass, inputClass, secondaryButtonClass } from '../../components/ui'
import { useHousehold } from '../../context/HouseholdContext'
import { errorMessage } from '../../utils/errors'

const nameSchema = z.object({ name: z.string().trim().min(2, 'El nombre es muy corto') })
const emailSchema = z.object({ email: z.email('Correo no válido') })

export function HouseholdManager() {
  const { households, current, members, select, create, addMember } = useHousehold()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)

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
      setNotice('Hogar creado.')
    } catch (reason) {
      setError(errorMessage(reason))
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
      setNotice('Miembro agregado.')
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Tus hogares</h2>
        {households.length === 0 ? <p className="text-stone-500">Aún no perteneces a un hogar.</p> : null}
        {households.map((household) => (
          <button
            key={household.id}
            type="button"
            className={`${household.id === current?.id ? buttonClass : secondaryButtonClass} w-full`}
            onClick={() => void select(household.id)}
          >
            {household.name}
            {household.role ? ` · ${household.role === 'owner' ? 'dueño' : 'miembro'}` : ''}
          </button>
        ))}
      </section>
      <form className="space-y-3" onSubmit={(event) => void onCreate(event)}>
        <h2 className="text-lg font-semibold">Nuevo hogar</h2>
        <Field label="Nombre">
          <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <button className={`${buttonClass} w-full`} disabled={pending} type="submit">
          Crear hogar
        </button>
      </form>
      {current ? (
        <form className="space-y-3" onSubmit={(event) => void onInvite(event)}>
          <h2 className="text-lg font-semibold">Agregar miembro</h2>
          <Field label="Correo de una cuenta ya registrada">
            <input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <button className={`${secondaryButtonClass} w-full`} disabled={pending} type="submit">
            Invitar
          </button>
          <ul className="space-y-2">
            {members.map((member) => (
              <li key={member.id} className="rounded-xl bg-white px-3 py-3">
                {member.name} · {member.email}
              </li>
            ))}
          </ul>
        </form>
      ) : null}
      {notice ? <p className="text-sm text-emerald-800">{notice}</p> : null}
      {error ? <ErrorBlock message={error} /> : null}
    </div>
  )
}
