import { useCallback, useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import type { Teacher } from '../../shared/teachers'
import type { TeacherInput } from '../../shared/electron-api'
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
import { TeacherForm } from '../components/TeacherForm'

type ViewMode = { type: 'list' } | { type: 'create' } | { type: 'edit'; teacher: Teacher }

export function Teachers(): React.JSX.Element {
  const [teachers, setTeachers] = useState<Teacher[] | null>(null)
  const [mode, setMode] = useState<ViewMode>({ type: 'list' })

  const loadTeachers = useCallback(async () => {
    const data = await window.api.teacher.list()
    setTeachers(data)
  }, [])

  useEffect(() => {
    window.api.teacher.list().then(setTeachers)
  }, [])

  async function handleCreate(values: TeacherInput): Promise<void> {
    await window.api.teacher.create(values)
    setMode({ type: 'list' })
    await loadTeachers()
  }

  async function handleUpdate(id: string, values: TeacherInput): Promise<void> {
    await window.api.teacher.update(id, values)
    setMode({ type: 'list' })
    await loadTeachers()
  }

  async function handleDelete(id: string): Promise<void> {
    if (!window.confirm('¿Eliminar este profesor?')) return
    await window.api.teacher.delete(id)
    await loadTeachers()
  }

  if (mode.type === 'create') {
    return (
      <div className="space-y-6">
        <PageHeader title="Nuevo profesor" />
        <TeacherForm onSubmit={handleCreate} onCancel={() => setMode({ type: 'list' })} />
      </div>
    )
  }

  if (mode.type === 'edit') {
    const { teacher } = mode
    return (
      <div className="space-y-6">
        <PageHeader title="Editar profesor" />
        <TeacherForm
          initialValues={teacher}
          onSubmit={(values) => handleUpdate(teacher.id, values)}
          onCancel={() => setMode({ type: 'list' })}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profesores"
        action={<Button onClick={() => setMode({ type: 'create' })}>Crear profesor</Button>}
      />

      {teachers === null ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : teachers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay profesores cargados todavía"
          description="Creá el primer profesor para empezar a asignar cursos."
          action={<Button onClick={() => setMode({ type: 'create' })}>Crear profesor</Button>}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell className="font-medium">
                  {teacher.firstName} {teacher.lastName}
                </TableCell>
                <TableCell>{teacher.dni}</TableCell>
                <TableCell>{teacher.email}</TableCell>
                <TableCell>{teacher.phone}</TableCell>
                <TableCell>
                  <Badge variant={teacher.active ? 'success' : 'secondary'}>
                    {teacher.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMode({ type: 'edit', teacher })}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(teacher.id)}
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
