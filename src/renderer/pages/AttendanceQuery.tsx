import { useEffect, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import type { Attendance, AttendanceRegisteredBy, AttendanceStatus } from '../../shared/attendance'
import type { CourseEdition, CourseTemplate } from '../../shared/courses'
import type { Student } from '../../shared/students'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { PageHeader } from '../components/ui/page-header'
import { EmptyState } from '../components/ui/empty-state'
import { FormField } from '../components/ui/form-field'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Presente',
  absent: 'Ausente',
  justified: 'Justificada'
}

const STATUS_BADGE_VARIANT: Record<AttendanceStatus, 'success' | 'destructive' | 'secondary'> = {
  present: 'success',
  absent: 'destructive',
  justified: 'secondary'
}

const REGISTERED_BY_LABELS: Record<AttendanceRegisteredBy, string> = {
  system: 'Sistema',
  teacher: 'Docente'
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function AttendanceQuery(): React.JSX.Element {
  const [courseEditions, setCourseEditions] = useState<CourseEdition[]>([])
  const [courseTemplates, setCourseTemplates] = useState<CourseTemplate[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [courseEditionId, setCourseEditionId] = useState('')
  const [date, setDate] = useState('')
  const [attendances, setAttendances] = useState<Attendance[] | null>(null)

  useEffect(() => {
    window.api.courseEdition.list().then(setCourseEditions)
    window.api.courseTemplate.list().then(setCourseTemplates)
    window.api.student.list().then(setStudents)
  }, [])

  useEffect(() => {
    if (!courseEditionId || !date) return
    window.api.attendance.list(courseEditionId, parseLocalDate(date)).then(setAttendances)
  }, [courseEditionId, date])

  function templateName(templateId: string): string {
    return courseTemplates.find((template) => template.id === templateId)?.name ?? templateId
  }

  function studentInfo(studentId: string): { name: string; dni: string } {
    const student = students.find((candidate) => candidate.id === studentId)
    return student
      ? { name: `${student.firstName} ${student.lastName}`, dni: student.dni }
      : { name: studentId, dni: '—' }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Asistencias" />

      <div className="flex max-w-xl gap-4">
        <div className="flex-1">
          <FormField label="Edición" htmlFor="courseEditionId">
            <Select
              id="courseEditionId"
              value={courseEditionId}
              onChange={(event) => {
                setCourseEditionId(event.target.value)
                setAttendances(null)
              }}
            >
              <option value="">Seleccionar...</option>
              {courseEditions.map((courseEdition) => (
                <option key={courseEdition.id} value={courseEdition.id}>
                  {templateName(courseEdition.templateId)}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="flex-1">
          <FormField label="Fecha" htmlFor="date">
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value)
                setAttendances(null)
              }}
            />
          </FormField>
        </div>
      </div>

      {attendances === null ? (
        <EmptyState
          icon={ClipboardList}
          title="Seleccioná una edición y una fecha"
          description="Elegí ambos filtros para ver las asistencias registradas."
        />
      ) : attendances.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No hay asistencias registradas"
          description="No se encontraron registros para esa edición y fecha."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alumno</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Registrado por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendances.map((attendance) => {
              const info = studentInfo(attendance.studentId)
              return (
                <TableRow key={attendance.id}>
                  <TableCell className="font-medium">{info.name}</TableCell>
                  <TableCell>{info.dni}</TableCell>
                  <TableCell>{attendance.time}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[attendance.status]}>
                      {STATUS_LABELS[attendance.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{REGISTERED_BY_LABELS[attendance.registeredBy]}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
