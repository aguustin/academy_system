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

function programFileName(programFile: string): string {
  return programFile.replace(/^\d+-/, '')
}

interface CourseProgramSectionProps {
  courseTemplate: CourseTemplate
  onChange: (courseTemplate: CourseTemplate) => void
}

function CourseProgramSection({
  courseTemplate,
  onChange
}: CourseProgramSectionProps): React.JSX.Element {
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
    if (!window.confirm('¿Eliminar el programa de este curso?')) return
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
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Programa del curso</h2>
      <p className="text-sm text-muted-foreground">
        Programa:{' '}
        {courseTemplate.programFile ? programFileName(courseTemplate.programFile) : 'Sin archivo'}
      </p>
      <div className="flex gap-2">
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
    </div>
  )
}

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
        <CourseProgramSection
          courseTemplate={courseTemplate}
          onChange={(updated) => setMode({ type: 'edit', courseTemplate: updated })}
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
