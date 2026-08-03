import { useCallback, useEffect, useRef, useState } from 'react'
import { Users } from 'lucide-react'
import type { Student } from '../../shared/students'
import type { Enrollment } from '../../shared/enrollments'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'
import { EmptyState } from './ui/empty-state'
import { Pagination } from './ui/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { usePagination } from '../hooks/use-pagination'
import { normalizeText, sortByName } from '../lib/utils'

interface EnrollmentsSectionProps {
  courseEditionId: string
}

function matchesSearch(student: Student, term: string): boolean {
  const trimmed = term.trim()
  return (
    normalizeText(student.lastName).includes(normalizeText(trimmed)) ||
    student.dni.includes(trimmed)
  )
}

export function EnrollmentsSection({
  courseEditionId
}: EnrollmentsSectionProps): React.JSX.Element {
  const [students, setStudents] = useState<Student[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[] | null>(null)
  const [addSearch, setAddSearch] = useState('')
  const [search, setSearch] = useState('')
  const addSearchInputRef = useRef<HTMLInputElement>(null)

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

  async function handleAddStudent(studentId: string): Promise<void> {
    await window.api.enrollment.create({ studentId, courseEditionId })
    await loadEnrollments()
    addSearchInputRef.current?.focus()
  }

  async function handleRemove(enrollmentId: string): Promise<void> {
    await window.api.enrollment.delete(enrollmentId)
    await loadEnrollments()
  }

  const enrolledIds = new Set((enrollments ?? []).map((enrollment) => enrollment.studentId))

  const addSearchTerm = addSearch.trim()
  const addSearchMatches =
    addSearchTerm === '' ? [] : students.filter((student) => matchesSearch(student, addSearchTerm))
  const addSearchAvailableMatches = sortByName(
    addSearchMatches.filter((student) => !enrolledIds.has(student.id))
  )

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
    return student ? matchesSearch(student, search) : false
  })

  const pagination = usePagination(filteredEnrollments)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">Alumnos inscriptos</h2>

      <div className="max-w-sm space-y-2">
        <Input
          ref={addSearchInputRef}
          placeholder="Agregar alumno por apellido o DNI..."
          value={addSearch}
          onChange={(event) => setAddSearch(event.target.value)}
        />
        {addSearchTerm !== '' && (
          <Card className="divide-y divide-border overflow-hidden">
            {addSearchMatches.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">No se encontraron alumnos.</p>
            ) : addSearchAvailableMatches.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                Todos los alumnos encontrados ya pertenecen a esta edición.
              </p>
            ) : (
              addSearchAvailableMatches.map((student) => (
                <div key={student.id} className="flex items-center justify-between gap-3 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {student.lastName} {student.firstName}
                    </p>
                    <p className="text-xs text-muted-foreground">DNI: {student.dni}</p>
                  </div>
                  <Button type="button" size="sm" onClick={() => handleAddStudent(student.id)}>
                    Agregar
                  </Button>
                </div>
              ))
            )}
          </Card>
        )}
      </div>

      {enrollments === null ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : enrollments.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay alumnos inscriptos todavía"
          description="Usá el buscador de arriba para inscribir alumnos en esta edición."
        />
      ) : (
        <div className="space-y-3">
          <Input
            placeholder="Filtrar por apellido o DNI..."
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
