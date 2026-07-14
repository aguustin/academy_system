import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

const ERROR_MESSAGES = {
  'user-not-found': 'El usuario ingresado no existe.',
  'invalid-password': 'La contraseña es incorrecta.',
  'inactive-user': 'El usuario está inactivo. Contactá a un administrador.'
} as const

export function Login(): React.JSX.Element {
  const { user, loading, setUser } = useAuth()
  const navigate = useNavigate()
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

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Sistema Académico</h1>
          <p className="text-sm text-muted-foreground">Iniciá sesión para continuar</p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="username" className="text-sm font-medium">
            Usuario
          </label>
          <Input
            id="username"
            autoFocus
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={submitting}>
          Ingresar
        </Button>
      </form>
    </div>
  )
}
