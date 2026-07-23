import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Badge } from './ui/badge'
import { ThemeToggle } from './ThemeToggle'

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
    <header className="flex h-14 shrink-0 items-center justify-end gap-4 border-b border-border bg-background/95 px-8 backdrop-blur-sm">
      {user && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-foreground">{user.username}</span>
          </div>
          <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
        </div>
      )}
      <ThemeToggle />
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
      >
        <LogOut className="size-4" />
        Salir
      </button>
    </header>
  )
}
