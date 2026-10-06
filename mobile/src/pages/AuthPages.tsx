import { Link } from 'react-router-dom'
import { LoginForm } from '@/features/auth/LoginForm'
import { RegisterForm } from '@/features/auth/RegisterForm'

export function LoginPage() {
  return (
    <div className="bg-background mx-auto flex min-h-svh max-w-lg flex-col justify-end px-4 pb-10">
      <p className="text-primary text-sm font-semibold tracking-wide">HomeFood</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">La cocina de tu hogar, en un solo lugar.</h1>
      <p className="text-muted-foreground mt-2 mb-8 text-sm">Entra para ver el plan, la despensa y las compras.</p>
      <LoginForm />
    </div>
  )
}

export function RegisterPage() {
  return (
    <div className="bg-background mx-auto flex min-h-svh max-w-lg flex-col justify-center px-4 py-10">
      <p className="text-primary text-sm font-semibold tracking-wide">HomeFood</p>
      <h1 className="mt-2 mb-6 text-3xl font-semibold tracking-tight">Crear cuenta</h1>
      <RegisterForm />
      <Link className="sr-only" to="/login">
        Entrar
      </Link>
    </div>
  )
}
