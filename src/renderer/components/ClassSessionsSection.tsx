import { useEffect, useState, type FormEvent } from 'react'
import { CalendarCheck } from 'lucide-react'
import type { ClassSession } from '../../shared/class-sessions'
import type { Holiday } from '../../shared/holidays'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { Input } from './ui/input'
import { FormField } from './ui/form-field'
import { EmptyState } from './ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { parseDateInput, sortByDateDesc } from '../lib/utils'
import { useAlertDialog, useConfirm } from './ui/confirm-dialog'

interface ClassSessionsSectionProps {
  courseEditionId: string
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-AR')
}

function toDateKey(date: Date): string {
  const local = new Date(date)
  return new Date(local.getFullYear(), local.getMonth(), local.getDate()).toISOString().slice(0, 10)
}

export function ClassSessionsSection({
  courseEditionId
}: ClassSessionsSectionProps): React.JSX.Element {
  const confirm = useConfirm()
  const alertDialog = useAlertDialog()
  const [classSessions, setClassSessions] = useState<ClassSession[] | null>(null)
  const [holidayDates, setHolidayDates] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newStartTime, setNewStartTime] = useState('18:00')
  const [newEndTime, setNewEndTime] = useState('20:00')
  const [addError, setAddError] = useState<string | null>(null)
  const [submittingAdd, setSubmittingAdd] = useState(false)

  useEffect(() => {
    window.api.classSession.listByEdition(courseEditionId).then(setClassSessions)
    window.api.holiday.list().then((holidays: Holiday[]) => {
      setHolidayDates(new Set(holidays.map((holiday) => toDateKey(holiday.date))))
    })
  }, [courseEditionId])

  async function handleGenerate(): Promise<void> {
    setGenerating(true)
    try {
      const result = await window.api.classSession.generate(courseEditionId)
      setClassSessions(result.sessions)
    } finally {
      setGenerating(false)
    }
  }

  async function handleCancel(classSession: ClassSession): Promise<void> {
    if (!(await confirm(`¿Cancelar la clase del ${formatDate(classSession.date)}?`))) return
    setCancelingId(classSession.id)
    try {
      await window.api.classSession.cancel(classSession.id)
      setClassSessions((prev) => prev?.filter((session) => session.id !== classSession.id) ?? null)
    } catch (err) {
      await alertDialog(err instanceof Error ? err.message : 'No se pudo cancelar la clase.')
    } finally {
      setCancelingId(null)
    }
  }

  function openAddForm(): void {
    setAddError(null)
    setNewDate('')
    setNewStartTime('18:00')
    setNewEndTime('20:00')
    setAdding(true)
  }

  async function handleAdd(event: FormEvent): Promise<void> {
    event.preventDefault()
    setAddError(null)
    setSubmittingAdd(true)
    try {
      const session = await window.api.classSession.add({
        courseEditionId,
        date: parseDateInput(newDate),
        startTime: newStartTime,
        endTime: newEndTime
      })
      setClassSessions((prev) => [...(prev ?? []), session])
      setAdding(false)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'No se pudo agregar la clase.')
    } finally {
      setSubmittingAdd(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Clases del curso</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={openAddForm}>
            Agregar clase
          </Button>
          <Button type="button" size="sm" onClick={handleGenerate} disabled={generating}>
            Generar clases
          </Button>
        </div>
      </div>

      {adding && (
        <Card className="max-w-xl p-6">
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <FormField label="Fecha" htmlFor="new-class-date">
                <Input
                  id="new-class-date"
                  type="date"
                  required
                  value={newDate}
                  onChange={(event) => setNewDate(event.target.value)}
                />
              </FormField>
              <FormField label="Hora inicio" htmlFor="new-class-start">
                <Input
                  id="new-class-start"
                  type="time"
                  required
                  value={newStartTime}
                  onChange={(event) => setNewStartTime(event.target.value)}
                />
              </FormField>
              <FormField label="Hora fin" htmlFor="new-class-end">
                <Input
                  id="new-class-end"
                  type="time"
                  required
                  value={newEndTime}
                  onChange={(event) => setNewEndTime(event.target.value)}
                />
              </FormField>
            </div>
            {addError && <p className="text-sm text-destructive">{addError}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={submittingAdd}>
                Guardar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdding(false)}
                disabled={submittingAdd}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {classSessions === null ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : classSessions.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Todavía no se generaron clases para esta edición"
          description="Usá el botón «Generar clases» para crearlas a partir de los horarios definidos."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortByDateDesc(classSessions, (classSession) => classSession.date).map(
              (classSession) => (
                <TableRow key={classSession.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {formatDate(classSession.date)}
                      {holidayDates.has(toDateKey(classSession.date)) && (
                        <Badge variant="secondary">Feriado</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {classSession.startTime} - {classSession.endTime}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={cancelingId === classSession.id}
                      onClick={() => handleCancel(classSession)}
                    >
                      Cancelar
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
