import { useCallback, useEffect, useState } from 'react'
import type { Student } from '../../shared/students'
import type { Enrollment } from '../../shared/enrollments'
import { Button } from './ui/button'
import { Select } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

interface EnrollmentsSectionProps {
  courseEditionId: string
}

export function EnrollmentsSection({
  courseEditionId
}: EnrollmentsSectionProps): React.JSX.Element {
  const [students, setStudents] = useState<Student[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[] | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState('')

  const loadEnrollments = useCallback(async () => {
    const data = await window.api.enrollment.listByCourseEdition(courseEditionId)
    setEnrollments(data)
  }, [courseEditionId])

  useEffect(() => {
    window.api.student.list().then(setStudents)
    window.api.enrollment.listByCourseEdition(courseEditionId).then(setEnrollments)
  }, [courseEditionId])

  function findStudent(studentId: string): Student | undefined {
    return students.find((candidate) => candidate.id === studentId)
  }

  async function handleAdd(): Promise<void> {
    if (!selectedStudentId) return
    await window.api.enrollment.create({ studentId: selectedStudentId, courseEditionId })
    setSelectedStudentId('')
    await loadEnrollments()
  }

  async function handleRemove(enrollmentId: string): Promise<void> {
    await window.api.enrollment.delete(enrollmentId)
    await loadEnrollments()
  }

  const enrolledIds = new Set((enrollments ?? []).map((enrollment) => enrollment.studentId))
  const availableStudents = students.filter((student) => !enrolledIds.has(student.id))

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Alumnos inscriptos</h2>

      <div className="flex max-w-md items-center gap-2">
        <Select
          value={selectedStudentId}
          onChange={(event) => setSelectedStudentId(event.target.value)}
        >
          <option value="">Seleccionar alumno...</option>
          {availableStudents.map((student) => (
            <option key={student.id} value={student.id}>
              {student.firstName} {student.lastName} (DNI {student.dni})
            </option>
          ))}
        </Select>
        <Button type="button" size="sm" onClick={handleAdd} disabled={!selectedStudentId}>
          Agregar
        </Button>
      </div>

      {enrollments === null ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : enrollments.length === 0 ? (
        <p className="text-muted-foreground">No hay alumnos inscriptos todavía.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alumno</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.map((enrollment) => {
              const student = findStudent(enrollment.studentId)
              return (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    {student ? `${student.firstName} ${student.lastName}` : enrollment.studentId}
                  </TableCell>
                  <TableCell>{student?.dni ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemove(enrollment.id)}
                    >
                      Quitar
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
