import { useEffect, useState } from 'react'
import type { TeacherCourseDetail } from '../../shared/electron-api'
import type { DayOfWeek } from '../../shared/courses'
import { Button } from './ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-AR')
}

interface CourseDetailProps {
  courseEditionId: string
  onBack: () => void
}

export function CourseDetail({ courseEditionId, onBack }: CourseDetailProps): React.JSX.Element {
  const [detail, setDetail] = useState<TeacherCourseDetail | null>(null)

  useEffect(() => {
    window.api.teacherCourse.getDetail(courseEditionId).then(setDetail)
  }, [courseEditionId])

  if (detail === null) {
    return <p className="text-muted-foreground">Cargando...</p>
  }

  const { courseEdition, courseTemplate, teacher, students, classSessions } = detail

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{courseTemplate?.name ?? 'Detalle del curso'}</h1>
        <Button variant="outline" size="sm" onClick={onBack}>
          Volver
        </Button>
      </div>

      <div className="space-y-1 text-sm text-muted-foreground">
        <p>Profesor: {teacher ? `${teacher.firstName} ${teacher.lastName}` : '—'}</p>
        <p>
          Inicio: {formatDate(courseEdition.startDate)} · Fin: {formatDate(courseEdition.endDate)}
        </p>
        <ul>
          {courseEdition.schedules.map((schedule, index) => (
            <li key={index}>
              {DAY_LABELS[schedule.dayOfWeek]} {schedule.startTime} - {schedule.endTime}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Alumnos inscriptos</h2>
        {students.length === 0 ? (
          <p className="text-muted-foreground">No hay alumnos inscriptos todavía.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno</TableHead>
                <TableHead>DNI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell>{student.dni}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Clases</h2>
        {classSessions.length === 0 ? (
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
    </div>
  )
}
