import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, GraduationCap, Search, UserCog } from 'lucide-react'
import type {
  GlobalSearchResult,
  GlobalSearchResultType,
  GlobalSearchResults
} from '../../shared/search'
import { Input } from './ui/input'
import { Card } from './ui/card'

const DEBOUNCE_MS = 250
const MIN_QUERY_LENGTH = 2

const GROUPS: { key: keyof GlobalSearchResults; label: string; icon: typeof Search }[] = [
  { key: 'students', label: 'Alumnos', icon: GraduationCap },
  { key: 'teachers', label: 'Docentes', icon: UserCog },
  { key: 'courseTemplates', label: 'Cursos', icon: BookOpen }
]

const RESULT_PATH: Record<GlobalSearchResultType, string> = {
  student: '/alumnos',
  teacher: '/usuarios',
  courseTemplate: '/cursos'
}

export function GlobalSearch(): React.JSX.Element {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GlobalSearchResults | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) return
    const timeout = setTimeout(() => {
      window.api.search.global(trimmed).then(setResults)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(result: GlobalSearchResult): void {
    setOpen(false)
    setQuery('')
    setResults(null)
    navigate(RESULT_PATH[result.type], { state: { prefillSearch: result.prefillSearch } })
  }

  const trimmedQuery = query.trim()
  // Se descartan resultados de una búsqueda anterior si la consulta actual ya no califica
  // (evita mostrar resultados obsoletos sin necesidad de limpiar el estado en un efecto).
  const activeResults = trimmedQuery.length >= MIN_QUERY_LENGTH ? results : null
  const hasResults =
    activeResults !== null &&
    (activeResults.students.length > 0 ||
      activeResults.teachers.length > 0 ||
      activeResults.courseTemplates.length > 0)
  const showEmptyState = activeResults !== null && !hasResults
  const showDropdown = open && trimmedQuery.length >= MIN_QUERY_LENGTH

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar alumnos, docentes o cursos..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false)
          }}
          className="pl-9"
        />
      </div>

      {showDropdown && (
        <Card className="absolute top-full z-50 mt-1 max-h-96 w-full overflow-auto p-2">
          {showEmptyState && (
            <p className="p-3 text-sm text-muted-foreground">No se encontraron resultados.</p>
          )}
          {activeResults === null && (
            <p className="p-3 text-sm text-muted-foreground">Buscando...</p>
          )}
          {GROUPS.map(({ key, label, icon: Icon }) => {
            const items = activeResults?.[key] ?? []
            if (items.length === 0) return null
            return (
              <div key={key} className="mb-2 last:mb-0">
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">{label}</p>
                {items.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-accent/60"
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate font-medium text-foreground">
                      {result.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {result.subtitle}
                    </span>
                  </button>
                ))}
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
