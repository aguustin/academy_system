import { useCallback, useEffect, useState } from 'react'
import type { Teacher } from '../../shared/teachers'
import type { TeacherInput } from '../../shared/electron-api'
import { Button } from '../components/ui/button'
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
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Nuevo profesor</h1>
        <TeacherForm onSubmit={handleCreate} onCancel={() => setMode({ type: 'list' })} />
      </div>
    )
  }

  if (mode.type === 'edit') {
    const { teacher } = mode
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Editar profesor</h1>
        <TeacherForm
          initialValues={teacher}
          onSubmit={(values) => handleUpdate(teacher.id, values)}
          onCancel={() => setMode({ type: 'list' })}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Profesores</h1>
        <Button onClick={() => setMode({ type: 'create' })}>Crear profesor</Button>
      </div>

      {teachers === null ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : teachers.length === 0 ? (
        <p className="text-muted-foreground">No hay profesores cargados todavía.</p>
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
                <TableCell>
                  {teacher.firstName} {teacher.lastName}
                </TableCell>
                <TableCell>{teacher.dni}</TableCell>
                <TableCell>{teacher.email}</TableCell>
                <TableCell>{teacher.phone}</TableCell>
                <TableCell>{teacher.active ? 'Sí' : 'No'}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMode({ type: 'edit', teacher })}
                  >
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(teacher.id)}>
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
