import { useCallback, useEffect, useState } from 'react'
import { CalendarRange } from 'lucide-react'
import type {
  CourseEdition,
  CourseEditionInput,
  CourseEditionStatus,
  CourseTemplate
} from '../../shared/courses'
import type { Teacher } from '../../shared/teachers'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { PageHeader } from '../components/ui/page-header'
import { EmptyState } from '../components/ui/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'
import { CourseEditionForm } from '../components/CourseEditionForm'
import { EnrollmentsSection } from '../components/EnrollmentsSection'
import { ClassSessionsSection } from '../components/ClassSessionsSection'

type ViewMode =
  { type: 'list' } | { type: 'create' } | { type: 'edit'; courseEdition: CourseEdition }

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

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-AR')
}

export function CourseEditions(): React.JSX.Element {
  const [courseEditions, setCourseEditions] = useState<CourseEdition[] | null>(null)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [courseTemplates, setCourseTemplates] = useState<CourseTemplate[]>([])
  const [mode, setMode] = useState<ViewMode>({ type: 'list' })

  const loadCourseEditions = useCallback(async () => {
    const data = await window.api.courseEdition.list()
    setCourseEditions(data)
  }, [])

  useEffect(() => {
    window.api.courseEdition.list().then(setCourseEditions)
    window.api.teacher.list().then(setTeachers)
    window.api.courseTemplate.list().then(setCourseTemplates)
  }, [])

  function templateName(templateId: string): string {
    return (
      courseTemplates.find((courseTemplate) => courseTemplate.id === templateId)?.name ?? templateId
    )
  }

  function teacherName(teacherId: string): string {
    const teacher = teachers.find((candidate) => candidate.id === teacherId)
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : teacherId
  }

  async function handleCreate(values: CourseEditionInput): Promise<void> {
    await window.api.courseEdition.create(values)
    setMode({ type: 'list' })
    await loadCourseEditions()
  }

  async function handleUpdate(id: string, values: CourseEditionInput): Promise<void> {
    await window.api.courseEdition.update(id, values)
    setMode({ type: 'list' })
    await loadCourseEditions()
  }

  async function handleDelete(id: string): Promise<void> {
    if (!window.confirm('¿Eliminar esta edición de curso?')) return
    await window.api.courseEdition.delete(id)
    await loadCourseEditions()
  }

  if (mode.type === 'create') {
    return (
      <div className="space-y-6">
        <PageHeader title="Nueva edición" />
        <CourseEditionForm
          teachers={teachers}
          courseTemplates={courseTemplates}
          onSubmit={handleCreate}
          onCancel={() => setMode({ type: 'list' })}
        />
      </div>
    )
  }

  if (mode.type === 'edit') {
    const { courseEdition } = mode
    return (
      <div className="space-y-10">
        <div className="space-y-6">
          <PageHeader title="Editar edición" />
          <CourseEditionForm
            initialValues={courseEdition}
            teachers={teachers}
            courseTemplates={courseTemplates}
            onSubmit={(values) => handleUpdate(courseEdition.id, values)}
            onCancel={() => setMode({ type: 'list' })}
          />
        </div>
        <EnrollmentsSection courseEditionId={courseEdition.id} />
        <ClassSessionsSection courseEditionId={courseEdition.id} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ediciones"
        action={<Button onClick={() => setMode({ type: 'create' })}>Crear edición</Button>}
      />

      {courseEditions === null ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : courseEditions.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="No hay ediciones cargadas todavía"
          description="Creá la primera edición para empezar a inscribir alumnos."
          action={<Button onClick={() => setMode({ type: 'create' })}>Crear edición</Button>}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Curso</TableHead>
              <TableHead>Profesor</TableHead>
              <TableHead>Fecha inicio</TableHead>
              <TableHead>Fecha fin</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courseEditions.map((courseEdition) => (
              <TableRow key={courseEdition.id}>
                <TableCell className="font-medium">
                  {templateName(courseEdition.templateId)}
                </TableCell>
                <TableCell>{teacherName(courseEdition.teacherId)}</TableCell>
                <TableCell>{formatDate(courseEdition.startDate)}</TableCell>
                <TableCell>{formatDate(courseEdition.endDate)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE_VARIANT[courseEdition.status]}>
                    {STATUS_LABELS[courseEdition.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMode({ type: 'edit', courseEdition })}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(courseEdition.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
