import { useCallback, useEffect, useState } from 'react'
import { BookOpen, FileText } from 'lucide-react'
import type { CourseTemplate } from '../../shared/courses'
import type { CourseTemplateInput } from '../../shared/electron-api'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'
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
import { CourseTemplateForm } from '../components/CourseTemplateForm'
import { useConfirm } from '../components/ui/confirm-dialog'
import { normalizeText, stripTimestampPrefix } from '../lib/utils'
import { usePagination } from '../hooks/use-pagination'

interface CourseProgramSectionProps {
  courseTemplate: CourseTemplate
  onChange: (courseTemplate: CourseTemplate) => void
}

function CourseProgramSection({
  courseTemplate,
  onChange
}: CourseProgramSectionProps): React.JSX.Element {
  const confirm = useConfirm()
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(): Promise<void> {
    setError(null)
    setWorking(true)
    try {
      const updated = await window.api.courseProgram.upload(courseTemplate.id)
      onChange(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo adjuntar el programa.')
    } finally {
      setWorking(false)
    }
  }

  async function handleOpen(): Promise<void> {
    setError(null)
    try {
      await window.api.courseProgram.open(courseTemplate.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir el programa.')
    }
  }

  async function handleRemove(): Promise<void> {
    if (!(await confirm('¿Eliminar el programa de este curso?'))) return
    setError(null)
    setWorking(true)
    try {
      const updated = await window.api.courseProgram.remove(courseTemplate.id)
      onChange(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el programa.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <Card className="max-w-md space-y-3 p-6">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">Programa del curso</h2>
      <div className="flex items-center gap-2 text-sm">
        <FileText className="size-4 shrink-0 text-muted-foreground" />
        {courseTemplate.programFile ? (
          <span className="font-medium text-foreground">
            {stripTimestampPrefix(courseTemplate.programFile)}
          </span>
        ) : (
          <span className="text-muted-foreground">Sin archivo</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {courseTemplate.programFile ? (
          <>
            <Button variant="outline" size="sm" onClick={handleOpen} disabled={working}>
              Abrir
            </Button>
            <Button variant="outline" size="sm" onClick={handleUpload} disabled={working}>
              Reemplazar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleRemove} disabled={working}>
              Eliminar
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={handleUpload} disabled={working}>
            Adjuntar programa
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </Card>
  )
}

type ViewMode =
  { type: 'list' } | { type: 'create' } | { type: 'edit'; courseTemplate: CourseTemplate }

export function CourseTemplates(): React.JSX.Element {
  const confirm = useConfirm()
  const [courseTemplates, setCourseTemplates] = useState<CourseTemplate[] | null>(null)
  const [mode, setMode] = useState<ViewMode>({ type: 'list' })
  const [search, setSearch] = useState('')

  const loadCourseTemplates = useCallback(async () => {
    const data = await window.api.courseTemplate.list()
    setCourseTemplates(data)
  }, [])

  useEffect(() => {
    window.api.courseTemplate.list().then(setCourseTemplates)
  }, [])

  const filteredCourseTemplates = (courseTemplates ?? []).filter((courseTemplate) =>
    normalizeText(courseTemplate.name).includes(normalizeText(search.trim()))
  )
  const pagination = usePagination(filteredCourseTemplates)

  async function handleCreate(values: CourseTemplateInput): Promise<void> {
    await window.api.courseTemplate.create(values)
    setMode({ type: 'list' })
    await loadCourseTemplates()
  }

  async function handleUpdate(id: string, values: CourseTemplateInput): Promise<void> {
    await window.api.courseTemplate.update(id, values)
    setMode({ type: 'list' })
    await loadCourseTemplates()
  }

  async function handleDelete(id: string): Promise<void> {
    if (!(await confirm('¿Eliminar este curso?'))) return
    await window.api.courseTemplate.delete(id)
    await loadCourseTemplates()
  }

  if (mode.type === 'create') {
    return (
      <div className="space-y-6">
        <PageHeader title="Nuevo curso" />
        <CourseTemplateForm onSubmit={handleCreate} onCancel={() => setMode({ type: 'list' })} />
      </div>
    )
  }

  if (mode.type === 'edit') {
    const { courseTemplate } = mode
    return (
      <div className="space-y-8">
        <div className="space-y-6">
          <PageHeader title="Editar curso" />
          <CourseTemplateForm
            initialValues={courseTemplate}
            onSubmit={(values) => handleUpdate(courseTemplate.id, values)}
            onCancel={() => setMode({ type: 'list' })}
          />
        </div>
        <CourseProgramSection
          courseTemplate={courseTemplate}
          onChange={(updated) => setMode({ type: 'edit', courseTemplate: updated })}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo de Cursos"
        action={<Button onClick={() => setMode({ type: 'create' })}>Crear curso</Button>}
      />

      {courseTemplates === null ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : courseTemplates.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No hay cursos cargados todavía"
          description="Creá el primer curso del catálogo para poder generar ediciones."
          action={<Button onClick={() => setMode({ type: 'create' })}>Crear curso</Button>}
        />
      ) : (
        <div className="space-y-4">
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-sm"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pageItems.map((courseTemplate) => (
                <TableRow key={courseTemplate.id}>
                  <TableCell className="font-medium">{courseTemplate.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {courseTemplate.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant={courseTemplate.active ? 'success' : 'secondary'}>
                      {courseTemplate.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMode({ type: 'edit', courseTemplate })}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(courseTemplate.id)}
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
