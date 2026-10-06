import { Link } from 'react-router-dom'
import { LoginForm } from '../features/auth/LoginForm'
import { RegisterForm } from '../features/auth/RegisterForm'

export function LoginPage() {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center bg-stone-100 px-4">
      <h1 className="mb-6 text-3xl font-semibold text-emerald-900">HomeFood</h1>
      <LoginForm />
    </div>
  )
}

export function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center bg-stone-100 px-4 py-8">
      <h1 className="mb-6 text-3xl font-semibold text-emerald-900">Crear cuenta</h1>
      <RegisterForm />
      <Link className="sr-only" to="/login">
        Entrar
      </Link>
    </div>
  )
}
