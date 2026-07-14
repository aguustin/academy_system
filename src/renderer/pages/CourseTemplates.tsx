import { useCallback, useEffect, useState } from 'react'
import type { CourseTemplate } from '../../shared/courses'
import type { CourseTemplateInput } from '../../shared/electron-api'
import { Button } from '../components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'
import { CourseTemplateForm } from '../components/CourseTemplateForm'

type ViewMode =
  { type: 'list' } | { type: 'create' } | { type: 'edit'; courseTemplate: CourseTemplate }

export function CourseTemplates(): React.JSX.Element {
  const [courseTemplates, setCourseTemplates] = useState<CourseTemplate[] | null>(null)
  const [mode, setMode] = useState<ViewMode>({ type: 'list' })

  const loadCourseTemplates = useCallback(async () => {
    const data = await window.api.courseTemplate.list()
    setCourseTemplates(data)
  }, [])

  useEffect(() => {
    window.api.courseTemplate.list().then(setCourseTemplates)
  }, [])

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
    if (!window.confirm('¿Eliminar este curso?')) return
    await window.api.courseTemplate.delete(id)
    await loadCourseTemplates()
  }

  if (mode.type === 'create') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Nuevo curso</h1>
        <CourseTemplateForm onSubmit={handleCreate} onCancel={() => setMode({ type: 'list' })} />
      </div>
    )
  }

  if (mode.type === 'edit') {
    const { courseTemplate } = mode
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Editar curso</h1>
        <CourseTemplateForm
          initialValues={courseTemplate}
          onSubmit={(values) => handleUpdate(courseTemplate.id, values)}
          onCancel={() => setMode({ type: 'list' })}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Catálogo de Cursos</h1>
        <Button onClick={() => setMode({ type: 'create' })}>Crear curso</Button>
      </div>

      {courseTemplates === null ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : courseTemplates.length === 0 ? (
        <p className="text-muted-foreground">No hay cursos cargados todavía.</p>
      ) : (
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
            {courseTemplates.map((courseTemplate) => (
              <TableRow key={courseTemplate.id}>
                <TableCell>{courseTemplate.name}</TableCell>
                <TableCell>{courseTemplate.description}</TableCell>
                <TableCell>{courseTemplate.active ? 'Sí' : 'No'}</TableCell>
                <TableCell className="space-x-2 text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
