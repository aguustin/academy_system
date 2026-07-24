import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  // BarChart3,
  BookOpen,
  CalendarRange,
  ClipboardList,
  GraduationCap,
  //LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  UserCog
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../auth/AuthContext'

export function Sidebar(): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()

  const navItems =
    user?.role === 'teacher'
      ? [{ label: 'Mis Cursos', icon: BookOpen, to: '/mis-cursos' }]
      : [
          //{ label: 'Dashboard', icon: LayoutDashboard, to: '/' },
          { label: 'Catálogo de Cursos', icon: BookOpen, to: '/cursos' },
          { label: 'Ediciones', icon: CalendarRange, to: '/ediciones' },
          { label: 'Asistencias', icon: ClipboardList, to: '/asistencias' },
          ...(user?.role === 'admin'
            ? [
                { label: 'Usuarios', icon: UserCog, to: '/usuarios' },
                { label: 'Alumnos', icon: GraduationCap, to: '/alumnos' }
              ]
            : [])
          // { label: 'Reportes', icon: BarChart3 }
        ]

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-border bg-background transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-14 shrink-0 items-center gap-2 px-4">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
          SA
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-semibold text-foreground">Sistema Académico</span>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {navItems.map(({ label, icon: Icon, to }) =>
          to ? (
            <NavLink
              key={label}
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                )
              }
            >
              <Icon className="size-4 shrink-0" strokeWidth={2} />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ) : (
            <span
              key={label}
              aria-disabled="true"
              className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/40"
            >
              <Icon className="size-4 shrink-0" strokeWidth={2} />
              {!collapsed && <span className="truncate">{label}</span>}
            </span>
          )
        )}
      </nav>

      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>
    </aside>
  )
}
