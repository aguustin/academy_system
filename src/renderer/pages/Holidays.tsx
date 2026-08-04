import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { CalendarOff } from 'lucide-react'
import type { Holiday } from '../../shared/holidays'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { PageHeader } from '../components/ui/page-header'
import { EmptyState } from '../components/ui/empty-state'
import { FormField } from '../components/ui/form-field'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'
import { useAlertDialog, useConfirm } from '../components/ui/confirm-dialog'

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Un <input type="date"> da "YYYY-MM-DD"; `new Date(...)` de ese string lo interpreta como
// medianoche UTC, que en husos horarios negativos (ej. Argentina) cae en el día calendario
// anterior en hora local. Se arma la fecha a mano en hora local para que coincida con el
// mismo día que las fechas de las clases (ver toLocalDateOnly en class-session-service.ts).
function parseDateInput(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function Holidays(): React.JSX.Element {
  const confirm = useConfirm()
  const alertDialog = useAlertDialog()
  const [holidays, setHolidays] = useState<Holiday[] | null>(null)
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadHolidays = useCallback(async () => {
    const data = await window.api.holiday.list()
    setHolidays(data)
  }, [])

  useEffect(() => {
    window.api.holiday.list().then(setHolidays)
  }, [])

  async function handleCreate(event: FormEvent): Promise<void> {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await window.api.holiday.create({
        date: parseDateInput(date),
        description: description.trim() || undefined
      })
      setDate('')
      setDescription('')
      await loadHolidays()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el feriado.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(holiday: Holiday): Promise<void> {
    const label = holiday.description || formatDate(holiday.date)
    if (!(await confirm(`¿Eliminar el feriado "${label}"?`))) return
    try {
      await window.api.holiday.delete(holiday.id)
      await loadHolidays()
    } catch (err) {
      await alertDialog(err instanceof Error ? err.message : 'No se pudo eliminar el feriado.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feriados"
        description="Las fechas cargadas acá no se generan como clases al usar «Generar clases» en una edición."
      />

      <Card className="max-w-xl p-6">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <FormField label="Fecha" htmlFor="holiday-date">
              <Input
                id="holiday-date"
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </FormField>
            <FormField label="Descripción (opcional)" htmlFor="holiday-description">
              <Input
                id="holiday-description"
                placeholder="Ej: Día de la Independencia"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </FormField>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting} className="self-start">
            Agregar feriado
          </Button>
        </form>
      </Card>

      {holidays === null ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : holidays.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title="No hay feriados cargados"
          description="Agregá fechas para que no se generen clases en esos días."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holidays.map((holiday) => (
              <TableRow key={holiday.id}>
                <TableCell className="font-medium capitalize">{formatDate(holiday.date)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {holiday.description || '—'}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(holiday)}>
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
