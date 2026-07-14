import { useCallback, useEffect, useState } from 'react'
import type { Student } from '../../shared/students'
import type { StudentInput } from '../../shared/electron-api'
import { Button } from '../components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'
import { StudentForm } from '../components/StudentForm'

type ViewMode = { type: 'list' } | { type: 'create' } | { type: 'edit'; student: Student }

export function Students(): React.JSX.Element {
  const [students, setStudents] = useState<Student[] | null>(null)
  const [mode, setMode] = useState<ViewMode>({ type: 'list' })

  const loadStudents = useCallback(async () => {
    const data = await window.api.student.list()
    setStudents(data)
  }, [])

  useEffect(() => {
    window.api.student.list().then(setStudents)
  }, [])

  async function handleCreate(values: StudentInput): Promise<void> {
    await window.api.student.create(values)
    setMode({ type: 'list' })
    await loadStudents()
  }

  async function handleUpdate(id: string, values: StudentInput): Promise<void> {
    await window.api.student.update(id, values)
    setMode({ type: 'list' })
    await loadStudents()
  }

  async function handleDelete(id: string): Promise<void> {
    if (!window.confirm('¿Eliminar este alumno?')) return
    await window.api.student.delete(id)
    await loadStudents()
  }

  if (mode.type === 'create') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Nuevo alumno</h1>
        <StudentForm onSubmit={handleCreate} onCancel={() => setMode({ type: 'list' })} />
      </div>
    )
  }

  if (mode.type === 'edit') {
    const { student } = mode
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Editar alumno</h1>
        <StudentForm
          initialValues={student}
          onSubmit={(values) => handleUpdate(student.id, values)}
          onCancel={() => setMode({ type: 'list' })}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Alumnos</h1>
        <Button onClick={() => setMode({ type: 'create' })}>Crear alumno</Button>
      </div>

      {students === null ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : students.length === 0 ? (
        <p className="text-muted-foreground">No hay alumnos cargados todavía.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  {student.firstName} {student.lastName}
                </TableCell>
                <TableCell>{student.dni}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMode({ type: 'edit', student })}
                  >
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(student.id)}>
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
