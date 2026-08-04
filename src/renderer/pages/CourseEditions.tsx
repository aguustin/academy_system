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
import { Input } from '../components/ui/input'
import { PageHeader } from '../components/ui/page-header'
import { EmptyState } from '../components/ui/empty-state'
import { Pagination } from '../components/ui/pagination'
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
import { CourseDetail } from '../components/CourseDetail'
import { useAlertDialog, useConfirm } from '../components/ui/confirm-dialog'
import { usePagination } from '../hooks/use-pagination'
import { normalizeText, sortByDateDesc } from '../lib/utils'

type ViewMode =
  | { type: 'list' }
  | { type: 'create' }
  | { type: 'edit'; courseEdition: CourseEdition }
  | { type: 'detail'; courseEdition: CourseEdition }

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

// CourseEdition.startDate/endDate se construyen a partir de un input type="date" (sin hora),
// lo que el motor de JS interpreta como medianoche UTC. Formatear en zona local puede mostrar
// el día calendario anterior según el huso horario de la máquina; forzar UTC en el formateo
// recupera el día que realmente se eligió, sin tocar cómo se genera o persiste la fecha.
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-AR', { timeZone: 'UTC' })
}

export function CourseEditions(): React.JSX.Element {
  const confirm = useConfirm()
  const alertDialog = useAlertDialog()
  const [courseEditions, setCourseEditions] = useState<CourseEdition[] | null>(null)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [courseTemplates, setCourseTemplates] = useState<CourseTemplate[]>([])
  const [mode, setMode] = useState<ViewMode>({ type: 'list' })
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)

  const loadCourseEditions = useCallback(async () => {
    const data = await window.api.courseEdition.list()
    setCourseEditions(data)
  }, [])

  useEffect(() => {
    window.api.courseEdition.list().then(setCourseEditions)
    window.api.teacher.list().then(setTeachers)
    window.api.courseTemplate.list().then(setCourseTemplates)
  }, [])

  const sortedCourseEditions = sortByDateDesc(
    courseEditions ?? [],
    (courseEdition) => courseEdition.startDate
  )
  const filteredCourseEditions = sortedCourseEditions.filter((courseEdition) =>
    normalizeText(templateName(courseEdition.templateId)).includes(normalizeText(search.trim()))
  )
  const pagination = usePagination(filteredCourseEditions)

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
    if (!(await confirm('¿Eliminar esta edición de curso?'))) return
    await window.api.courseEdition.delete(id)
    await loadCourseEditions()
  }

  function toggleSelected(id: string): void {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleExport(): Promise<void> {
    setExporting(true)
    try {
      const filePath = await window.api.courseEdition.exportAttendance([...selectedIds])
      if (filePath) {
        setSelectedIds(new Set())
        await alertDialog(`Archivo exportado correctamente en: ${filePath}`)
      }
    } catch (error) {
      await alertDialog(error instanceof Error ? error.message : 'No se pudo exportar el archivo.')
    } finally {
      setExporting(false)
    }
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

  if (mode.type === 'detail') {
    return (
      <CourseDetail
        courseEditionId={mode.courseEdition.id}
        onBack={() => setMode({ type: 'list' })}
      />
    )
  }

  if (mode.type === 'edit') {
    const { courseEdition } = mode
    return (
      <div className="space-y-10">
        <div className="space-y-6">
          <PageHeader
            title="Editar edición"
            action={
              <Button variant="outline" size="sm" onClick={() => setMode({ type: 'list' })}>
                Volver
              </Button>
            }
          />
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
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={selectedIds.size === 0 || exporting}
            >
              {exporting ? 'Exportando...' : 'Exportar'}
            </Button>
            <Button onClick={() => setMode({ type: 'create' })}>Crear edición</Button>
          </div>
        }
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
        <div className="space-y-4">
          <Input
            placeholder="Buscar por curso..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-sm"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Curso</TableHead>
                <TableHead>Profesor</TableHead>
                <TableHead>Fecha inicio</TableHead>
                <TableHead>Fecha fin</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pageItems.map((courseEdition) => (
                <TableRow key={courseEdition.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(courseEdition.id)}
                      onChange={() => toggleSelected(courseEdition.id)}
                      aria-label={`Seleccionar ${templateName(courseEdition.templateId)}`}
                      className="size-4 rounded border-input accent-primary"
                    />
                  </TableCell>
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
                        onClick={() => setMode({ type: 'detail', courseEdition })}
                      >
                        Ver detalle
                      </Button>
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
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      )}
    </div>
  )
}
