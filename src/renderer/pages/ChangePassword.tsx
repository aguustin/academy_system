import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { FormField } from '../components/ui/form-field'

export function ChangePassword(): React.JSX.Element {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    setError(null)

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSubmitting(true)
    try {
      const user = await window.api.auth.changePassword(newPassword)
      setUser(user)
      navigate('/', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-sm p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold tracking-tight">
              Cambio de contraseña obligatorio
            </h1>
            <p className="text-sm text-muted-foreground">
              Es tu primer inicio de sesión. Elegí una nueva contraseña para continuar.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <FormField label="Nueva contraseña" htmlFor="newPassword">
              <Input
                id="newPassword"
                type="password"
                autoFocus
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </FormField>

            <FormField label="Confirmar contraseña" htmlFor="confirmPassword">
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </FormField>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            Guardar y continuar
          </Button>
        </form>
      </Card>
    </div>
  )
}
