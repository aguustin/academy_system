import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { FormField } from '../components/ui/form-field'

const ERROR_MESSAGES = {
  'user-not-found': 'El usuario ingresado no existe.',
  'invalid-password': 'La contraseña es incorrecta.',
  'inactive-user': 'El usuario está inactivo. Contactá a un administrador.'
} as const

export function Login(): React.JSX.Element {
  const { user, loading, setUser } = useAuth()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to={user.mustChangePassword ? '/cambiar-contrasena' : '/'} replace />
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await window.api.auth.login(username, password)
      if (result.status === 'ok') {
        setUser(result.user)
        navigate(result.user.mustChangePassword ? '/cambiar-contrasena' : '/', { replace: true })
        return
      }
      setError(ERROR_MESSAGES[result.status])
    } finally {
      setSubmitting(false)
    }
  }

  if (!showForm) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <Card className="w-full max-w-sm p-8">
          <div className="mb-6 space-y-1 text-center">
            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
              SA
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Sistema Académico</h1>
          </div>

          <div className="flex flex-col gap-3">
            <Button className="w-full" onClick={() => setShowForm(true)}>
              Ingresar
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/registrar-asistencia')}
            >
              Registrar asistencia
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-sm p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-1 text-center">
            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
              SA
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Sistema Académico</h1>
            <p className="text-sm text-muted-foreground">Iniciá sesión para continuar</p>
          </div>

          <div className="flex flex-col gap-4">
            <FormField label="Usuario" htmlFor="username">
              <Input
                id="username"
                autoFocus
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </FormField>

            <FormField label="Contraseña" htmlFor="password">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </FormField>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            Ingresar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowForm(false)}
            disabled={submitting}
          >
            Volver
          </Button>
        </form>
      </Card>
    </div>
  )
}
