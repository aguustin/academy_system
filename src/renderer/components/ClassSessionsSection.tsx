import { useEffect, useState } from 'react'
import type { ClassSession } from '../../shared/class-sessions'
import { Button } from './ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Clases del curso</h2>
        <Button type="button" size="sm" onClick={handleGenerate} disabled={generating}>
          Generar clases
        </Button>
      </div>

      {classSessions === null ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : classSessions.length === 0 ? (
        <p className="text-muted-foreground">Todavía no se generaron clases para esta edición.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Horario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classSessions.map((classSession) => (
              <TableRow key={classSession.id}>
                <TableCell>{formatDate(classSession.date)}</TableCell>
                <TableCell>
                  {classSession.startTime} - {classSession.endTime}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
