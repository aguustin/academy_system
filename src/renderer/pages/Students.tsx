import { useCallback, useEffect, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import type { Student } from '../../shared/students'
import type { StudentInput } from '../../shared/electron-api'
import { Button } from '../components/ui/button'
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
      <div className="space-y-6">
        <PageHeader title="Nuevo alumno" />
        <StudentForm onSubmit={handleCreate} onCancel={() => setMode({ type: 'list' })} />
      </div>
    )
  }

  if (mode.type === 'edit') {
    const { student } = mode
    return (
      <div className="space-y-6">
        <PageHeader title="Editar alumno" />
        <StudentForm
          initialValues={student}
          onSubmit={(values) => handleUpdate(student.id, values)}
          onCancel={() => setMode({ type: 'list' })}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alumnos"
        action={<Button onClick={() => setMode({ type: 'create' })}>Crear alumno</Button>}
      />

      {students === null ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : students.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No hay alumnos cargados todavía"
          description="Creá el primer alumno para poder inscribirlo en una edición."
          action={<Button onClick={() => setMode({ type: 'create' })}>Crear alumno</Button>}
        />
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
                <TableCell className="font-medium">
                  {student.firstName} {student.lastName}
                </TableCell>
                <TableCell>{student.dni}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMode({ type: 'edit', student })}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(student.id)}
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
