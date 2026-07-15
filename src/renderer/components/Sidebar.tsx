import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CalendarRange,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  UserCog,
  Users
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
          { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
          { label: 'Profesores', icon: Users, to: '/profesores' },
          { label: 'Catálogo de Cursos', icon: BookOpen, to: '/cursos' },
          { label: 'Ediciones', icon: CalendarRange, to: '/ediciones' },
          { label: 'Registro de Asistencia', icon: CalendarCheck, to: '/asistencias/registro' },
          { label: 'Asistencias', icon: ClipboardList, to: '/asistencias' },
          ...(user?.role === 'admin'
            ? [
                { label: 'Usuarios', icon: UserCog, to: '/usuarios' },
                { label: 'Alumnos', icon: GraduationCap, to: '/alumnos' }
              ]
            : []),
          { label: 'Reportes', icon: BarChart3 }
        ]

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-border bg-background transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map(({ label, icon: Icon, to }) =>
          to ? (
            <NavLink
              key={label}
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ) : (
            <span
              key={label}
              aria-disabled="true"
              className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/50"
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </span>
          )
        )}
      </nav>
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        className="m-2 flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
      </button>
    </aside>
  )
}
