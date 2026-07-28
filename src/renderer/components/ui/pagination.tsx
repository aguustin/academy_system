import { PAGE_SIZE_OPTIONS, type PageSize } from '../../hooks/use-pagination'
import { Button } from './button'
import { Select } from './select'

interface PaginationProps {
  page: number
  totalPages: number
  pageSize: PageSize
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSize) => void
}

export function Pagination({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange
}: PaginationProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Mostrar</span>
        <Select
          value={String(pageSize)}
          onChange={(event) => {
            const value = event.target.value
            onPageSizeChange(value === 'all' ? 'all' : (Number(value) as PageSize))
          }}
          className="h-8 w-24"
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'all' ? 'Todos' : option}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Anterior
        </Button>
        <span className="text-muted-foreground">
          Página {page} de {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
