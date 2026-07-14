import { LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const ROLE_LABELS = {
  admin: 'Administración',
  teacher: 'Tallerista'
} as const

export function Header(): React.JSX.Element {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  async function handleLogout(): Promise<void> {
    await window.api.auth.logout()
    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <span className="font-semibold">Sistema Académico</span>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <User className="size-4" />
          <span>{user ? `${user.username} · ${ROLE_LABELS[user.role]}` : 'Invitado'}</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="size-4" />
          Salir
        </button>
      </div>
    </header>
  )
}
