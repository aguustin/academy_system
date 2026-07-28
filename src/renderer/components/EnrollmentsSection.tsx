import { useCallback, useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import type { Student } from '../../shared/students'
import type { Enrollment } from '../../shared/enrollments'
import { Button } from './ui/button'
import { Select } from './ui/select'
import { Input } from './ui/input'
import { EmptyState } from './ui/empty-state'
import { Pagination } from './ui/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { usePagination } from '../hooks/use-pagination'
import { normalizeText } from '../lib/utils'

interface EnrollmentsSectionProps {
  courseEditionId: string
}

export function EnrollmentsSection({
  courseEditionId
}: EnrollmentsSectionProps): React.JSX.Element {
  const [students, setStudents] = useState<Student[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[] | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [search, setSearch] = useState('')

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

  const sortedEnrollments = [...(enrollments ?? [])].sort((a, b) => {
    const studentA = findStudent(a.studentId)
    const studentB = findStudent(b.studentId)
    return (
      (studentA?.lastName ?? '').localeCompare(studentB?.lastName ?? '', 'es') ||
      (studentA?.firstName ?? '').localeCompare(studentB?.firstName ?? '', 'es')
    )
  })

  const filteredEnrollments = sortedEnrollments.filter((enrollment) => {
    const student = findStudent(enrollment.studentId)
    const term = normalizeText(search.trim())
    return (
      normalizeText(student?.lastName ?? '').includes(term) ||
      (student?.dni ?? '').includes(search.trim())
    )
  })

  const pagination = usePagination(filteredEnrollments)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">Alumnos inscriptos</h2>

      <div className="flex max-w-md items-center gap-2">
        <Select
          value={selectedStudentId}
          onChange={(event) => setSelectedStudentId(event.target.value)}
        >
          <option value="">Seleccionar alumno...</option>
          {availableStudents.map((student) => (
            <option key={student.id} value={student.id}>
              {student.lastName} {student.firstName} (DNI {student.dni})
            </option>
          ))}
        </Select>
        <Button type="button" size="sm" onClick={handleAdd} disabled={!selectedStudentId}>
          Agregar
        </Button>
      </div>

      {enrollments === null ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : enrollments.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay alumnos inscriptos todavía"
          description="Seleccioná un alumno de la lista para inscribirlo en esta edición."
        />
      ) : (
        <div className="space-y-3">
          <Input
            placeholder="Buscar por apellido o DNI..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-sm"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pageItems.map((enrollment) => {
                const student = findStudent(enrollment.studentId)
                return (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">
                      {student ? `${student.lastName} ${student.firstName}` : enrollment.studentId}
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
