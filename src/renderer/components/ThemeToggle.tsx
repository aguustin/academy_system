import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../theme/theme-context'
import { cn } from '../lib/utils'

export function ThemeToggle(): React.JSX.Element {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      onClick={toggleTheme}
      className="relative flex h-7 w-14 shrink-0 items-center rounded-full border border-input bg-secondary px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Sun className="absolute left-1.5 size-3.5 text-muted-foreground" />
      <Moon className="absolute right-1.5 size-3.5 text-muted-foreground" />
      <span
        className={cn(
          'z-10 flex size-5 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-transform duration-200',
          isDark ? 'translate-x-7' : 'translate-x-0'
        )}
      >
        {isDark ? <Moon className="size-3" /> : <Sun className="size-3" />}
      </span>
    </button>
  )
}
