import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import type { TeacherCourseSummary } from '../../shared/electron-api'
import type { CourseEditionStatus, DayOfWeek } from '../../shared/courses'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { EmptyState } from './ui/empty-state'

const STATUS_LABELS: Record<CourseEditionStatus, string> = {
  upcoming: 'Próxima',
  active: 'Activa',
  finished: 'Finalizada'
}

const STATUS_BADGE_VARIANT: Record<CourseEditionStatus, 'secondary' | 'success' | 'outline'> = {
  upcoming: 'secondary',
  active: 'success',
  finished: 'outline'
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

// CourseEdition.startDate/endDate se construyen a partir de un input type="date" (sin hora),
// lo que el motor de JS interpreta como medianoche UTC. Formatear en zona local puede mostrar
// el día calendario anterior según el huso horario de la máquina; forzar UTC en el formateo
// recupera el día que realmente se eligió, sin tocar cómo se genera o persiste la fecha.
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-AR', { timeZone: 'UTC' })
}

interface MyCoursesProps {
  onSelect: (courseEditionId: string) => void
}

export function MyCourses({ onSelect }: MyCoursesProps): React.JSX.Element {
  const [courses, setCourses] = useState<TeacherCourseSummary[] | null>(null)

  useEffect(() => {
    window.api.teacherCourse.listMyCourses().then(setCourses)
  }, [])

  if (courses === null) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>
  }

  if (courses.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No tenés cursos asignados todavía"
        description="Cuando un administrador te asigne una edición, va a aparecer acá."
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {courses.map(({ courseEdition, courseTemplate, studentCount, classSessionCount }) => (
        <Card key={courseEdition.id} className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground">
              {courseTemplate?.name ?? courseEdition.templateId}
            </h3>
            <Badge variant={STATUS_BADGE_VARIANT[courseEdition.status]}>
              {STATUS_LABELS[courseEdition.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Inicio: {formatDate(courseEdition.startDate)} · Fin: {formatDate(courseEdition.endDate)}
          </p>
          <ul className="space-y-0.5 text-sm text-muted-foreground">
            {courseEdition.schedules.map((schedule, index) => (
              <li key={index}>
                {DAY_LABELS[schedule.dayOfWeek]} {schedule.startTime} - {schedule.endTime}
              </li>
            ))}
          </ul>
          <p className="text-sm text-foreground">
            Alumnos: {studentCount} · Clases: {classSessionCount}
          </p>
          <Button size="sm" onClick={() => onSelect(courseEdition.id)}>
            Ver detalle
          </Button>
        </Card>
      ))}
    </div>
  )
}
