import { useEffect, useState } from 'react'
import type { Attendance, AttendanceRegisteredBy, AttendanceStatus } from '../../shared/attendance'
import type { CourseEdition, CourseTemplate } from '../../shared/courses'
import type { Student } from '../../shared/students'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
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
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Asistencias</h1>

      <div className="flex max-w-xl gap-4">
        <div className="flex-1 space-y-1">
          <label htmlFor="courseEditionId" className="text-sm font-medium">
            Edición
          </label>
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
        </div>

        <div className="flex-1 space-y-1">
          <label htmlFor="date" className="text-sm font-medium">
            Fecha
          </label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value)
              setAttendances(null)
            }}
          />
        </div>
      </div>

      {attendances === null ? (
        <p className="text-muted-foreground">
          Seleccioná una edición y una fecha para ver las asistencias.
        </p>
      ) : attendances.length === 0 ? (
        <p className="text-muted-foreground">
          No hay asistencias registradas para esa edición y fecha.
        </p>
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
                  <TableCell>{info.name}</TableCell>
                  <TableCell>{info.dni}</TableCell>
                  <TableCell>{attendance.time}</TableCell>
                  <TableCell>{STATUS_LABELS[attendance.status]}</TableCell>
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
