import { useEffect, useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import type { ClassSession } from '../../shared/class-sessions'
import { Button } from './ui/button'
import { EmptyState } from './ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { sortByDateDesc } from '../lib/utils'

interface ClassSessionsSectionProps {
  courseEditionId: string
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-AR')
}

export function ClassSessionsSection({
  courseEditionId
}: ClassSessionsSectionProps): React.JSX.Element {
  const [classSessions, setClassSessions] = useState<ClassSession[] | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    window.api.classSession.listByEdition(courseEditionId).then(setClassSessions)
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Clases del curso</h2>
        <Button type="button" size="sm" onClick={handleGenerate} disabled={generating}>
          Generar clases
        </Button>
      </div>

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortByDateDesc(classSessions, (classSession) => classSession.date).map(
              (classSession) => (
                <TableRow key={classSession.id}>
                  <TableCell className="font-medium">{formatDate(classSession.date)}</TableCell>
                  <TableCell>
                    {classSession.startTime} - {classSession.endTime}
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
