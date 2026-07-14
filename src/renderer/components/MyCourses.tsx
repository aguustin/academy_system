import { useEffect, useState } from 'react'
import type { TeacherCourseSummary } from '../../shared/electron-api'
import type { CourseEditionStatus, DayOfWeek } from '../../shared/courses'
import { Button } from './ui/button'

const STATUS_LABELS: Record<CourseEditionStatus, string> = {
  upcoming: 'Próxima',
  active: 'Activa',
  finished: 'Finalizada'
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

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-AR')
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
    return <p className="text-muted-foreground">Cargando...</p>
  }

  if (courses.length === 0) {
    return <p className="text-muted-foreground">No tenés cursos asignados todavía.</p>
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {courses.map(({ courseEdition, courseTemplate, studentCount, classSessionCount }) => (
        <div key={courseEdition.id} className="space-y-2 rounded-md border border-border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{courseTemplate?.name ?? courseEdition.templateId}</h3>
            <span className="text-xs text-muted-foreground">
              {STATUS_LABELS[courseEdition.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Inicio: {formatDate(courseEdition.startDate)} · Fin: {formatDate(courseEdition.endDate)}
          </p>
          <ul className="text-sm text-muted-foreground">
            {courseEdition.schedules.map((schedule, index) => (
              <li key={index}>
                {DAY_LABELS[schedule.dayOfWeek]} {schedule.startTime} - {schedule.endTime}
              </li>
            ))}
          </ul>
          <p className="text-sm">
            Alumnos: {studentCount} · Clases: {classSessionCount}
          </p>
          <Button size="sm" onClick={() => onSelect(courseEdition.id)}>
            Ver detalle
          </Button>
        </div>
      ))}
    </div>
  )
}
