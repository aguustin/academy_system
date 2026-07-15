import { useEffect, useState, type FormEvent } from 'react'
import { z } from 'zod'
import type { TeacherCourseDetail } from '../../shared/electron-api'
import type { AttendanceSummary, ClassAttendanceStudent } from '../../shared/attendance'
import type { ClassSession } from '../../shared/class-sessions'
import type { DayOfWeek } from '../../shared/courses'
import {
  evaluationSchema,
  evaluationTypeSchema,
  type Evaluation,
  type EvaluationResultStatus,
  type EvaluationResultStudent,
  type EvaluationType
} from '../../shared/evaluations'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { StudentDetail } from './StudentDetail'

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

const EVALUATION_TYPE_LABELS: Record<EvaluationType, string> = {
  process: 'Proceso',
  final: 'Final'
}

const RESULT_STATUS_LABELS: Record<EvaluationResultStatus, string> = {
  'not-evaluated': 'Sin evaluar',
  passed: 'Aprobado',
  failed: 'Desaprobado'
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-AR')
}

type AttendanceMode =
  | { type: 'closed' }
  | { type: 'select-class' }
  | { type: 'marking'; classSession: ClassSession }
  | { type: 'summary' }

type EvaluationMode =
  | { type: 'closed' }
  | { type: 'list' }
  | { type: 'create' }
  | { type: 'edit'; evaluation: Evaluation }
  | { type: 'results'; evaluation: Evaluation }

const evaluationFormSchema = evaluationSchema.omit({
  id: true,
  courseEditionId: true,
  createdAt: true,
  updatedAt: true
})
type EvaluationFormValues = z.infer<typeof evaluationFormSchema>

interface EvaluationFormProps {
  initialValues?: Evaluation
  onSubmit: (values: EvaluationFormValues) => Promise<void>
  onCancel: () => void
}

function EvaluationForm({
  initialValues,
  onSubmit,
  onCancel
}: EvaluationFormProps): React.JSX.Element {
  const [values, setValues] = useState<EvaluationFormValues>({
    name: initialValues?.name ?? '',
    type: initialValues?.type ?? 'process'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()

    const result = evaluationFormSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      await onSubmit(result.data)
    } catch (error) {
      setErrors({
        name: error instanceof Error ? error.message : 'No se pudo guardar la evaluación.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="evaluationName" className="text-sm font-medium">
          Nombre
        </label>
        <Input
          id="evaluationName"
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="evaluationType" className="text-sm font-medium">
          Tipo
        </label>
        <Select
          id="evaluationType"
          value={values.type}
          onChange={(event) => setValues({ ...values, type: event.target.value as EvaluationType })}
        >
          {evaluationTypeSchema.options.map((option) => (
            <option key={option} value={option}>
              {EVALUATION_TYPE_LABELS[option]}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {initialValues ? 'Guardar' : 'Crear'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

interface CourseDetailProps {
  courseEditionId: string
  onBack: () => void
}

export function CourseDetail({ courseEditionId, onBack }: CourseDetailProps): React.JSX.Element {
  const [detail, setDetail] = useState<TeacherCourseDetail | null>(null)
  const [attendanceMode, setAttendanceMode] = useState<AttendanceMode>({ type: 'closed' })
  const [roster, setRoster] = useState<ClassAttendanceStudent[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [evaluationMode, setEvaluationMode] = useState<EvaluationMode>({ type: 'closed' })
  const [evaluations, setEvaluations] = useState<Evaluation[] | null>(null)
  const [results, setResults] = useState<EvaluationResultStudent[] | null>(null)
  const [savingResults, setSavingResults] = useState(false)
  const [resultsSavedMessage, setResultsSavedMessage] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  useEffect(() => {
    window.api.teacherCourse.getDetail(courseEditionId).then(setDetail)
  }, [courseEditionId])

  async function openClass(classSession: ClassSession): Promise<void> {
    setSavedMessage(null)
    setRoster(null)
    setAttendanceMode({ type: 'marking', classSession })
    const data = await window.api.attendance.listByClass(classSession.id)
    setRoster(data)
  }

  async function openSummary(): Promise<void> {
    setSummary(null)
    setAttendanceMode({ type: 'summary' })
    const data = await window.api.attendance.getSummary(courseEditionId)
    setSummary(data)
  }

  function toggleStudent(studentId: string): void {
    setRoster(
      (current) =>
        current?.map((student) =>
          student.studentId === studentId ? { ...student, present: !student.present } : student
        ) ?? null
    )
  }

  async function handleSaveAttendance(): Promise<void> {
    if (attendanceMode.type !== 'marking' || !roster) return
    setSaving(true)
    try {
      const entries = roster.map((student) => ({
        studentId: student.studentId,
        present: student.present
      }))
      const updated = await window.api.attendance.saveClassAttendance(
        attendanceMode.classSession.id,
        entries
      )
      setRoster(updated)
      setSavedMessage('Asistencia guardada correctamente.')
    } finally {
      setSaving(false)
    }
  }

  async function loadEvaluations(): Promise<void> {
    const data = await window.api.evaluation.list(courseEditionId)
    setEvaluations(data)
  }

  async function openEvaluations(): Promise<void> {
    setEvaluationMode({ type: 'list' })
    await loadEvaluations()
  }

  async function handleCreateEvaluation(values: EvaluationFormValues): Promise<void> {
    await window.api.evaluation.create({ courseEditionId, ...values })
    setEvaluationMode({ type: 'list' })
    await loadEvaluations()
  }

  async function handleUpdateEvaluation(id: string, values: EvaluationFormValues): Promise<void> {
    await window.api.evaluation.update(id, values)
    setEvaluationMode({ type: 'list' })
    await loadEvaluations()
  }

  async function handleDeleteEvaluation(id: string): Promise<void> {
    if (!window.confirm('¿Eliminar esta evaluación?')) return
    await window.api.evaluation.delete(id)
    await loadEvaluations()
  }

  async function openResults(evaluation: Evaluation): Promise<void> {
    setResultsSavedMessage(null)
    setResults(null)
    setEvaluationMode({ type: 'results', evaluation })
    const data = await window.api.evaluation.getResults(evaluation.id)
    setResults(data.students)
  }

  function setResultStatus(studentId: string, status: EvaluationResultStatus): void {
    setResults(
      (current) =>
        current?.map((student) =>
          student.studentId === studentId ? { ...student, status } : student
        ) ?? null
    )
  }

  async function handleSaveResults(): Promise<void> {
    if (evaluationMode.type !== 'results' || !results) return
    setSavingResults(true)
    try {
      const entries = results
        .filter((student) => student.status !== 'not-evaluated')
        .map((student) => ({ studentId: student.studentId, passed: student.status === 'passed' }))
      const data = await window.api.evaluation.saveResults(evaluationMode.evaluation.id, entries)
      setResults(data.students)
      setResultsSavedMessage('Resultados guardados correctamente.')
    } finally {
      setSavingResults(false)
    }
  }

  if (detail === null) {
    return <p className="text-muted-foreground">Cargando...</p>
  }

  if (selectedStudentId) {
    return (
      <StudentDetail
        courseEditionId={courseEditionId}
        studentId={selectedStudentId}
        onBack={() => setSelectedStudentId(null)}
      />
    )
  }

  const { courseEdition, courseTemplate, teacher, students, classSessions } = detail

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{courseTemplate?.name ?? 'Detalle del curso'}</h1>
        <Button variant="outline" size="sm" onClick={onBack}>
          Volver
        </Button>
      </div>

      <div className="space-y-1 text-sm text-muted-foreground">
        <p>Profesor: {teacher ? `${teacher.firstName} ${teacher.lastName}` : '—'}</p>
        <p>
          Inicio: {formatDate(courseEdition.startDate)} · Fin: {formatDate(courseEdition.endDate)}
        </p>
        <ul>
          {courseEdition.schedules.map((schedule, index) => (
            <li key={index}>
              {DAY_LABELS[schedule.dayOfWeek]} {schedule.startTime} - {schedule.endTime}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Alumnos inscriptos</h2>
        {students.length === 0 ? (
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
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell>{student.dni}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStudentId(student.id)}
                    >
                      Ver detalle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Clases</h2>
          {attendanceMode.type === 'closed' && classSessions.length > 0 && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setAttendanceMode({ type: 'select-class' })}>
                Marcar asistencias
              </Button>
              <Button size="sm" variant="outline" onClick={openSummary}>
                Ver total de asistencias
              </Button>
            </div>
          )}
          {attendanceMode.type !== 'closed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAttendanceMode({ type: 'closed' })}
            >
              Cerrar
            </Button>
          )}
        </div>

        {classSessions.length === 0 ? (
          <p className="text-muted-foreground">Todavía no se generaron clases para esta edición.</p>
        ) : attendanceMode.type === 'closed' ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Horario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classSessions.map((classSession) => (
                <TableRow key={classSession.id}>
                  <TableCell>{formatDate(classSession.date)}</TableCell>
                  <TableCell>
                    {classSession.startTime} - {classSession.endTime}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : attendanceMode.type === 'select-class' ? (
          <div className="flex flex-wrap gap-2">
            {classSessions.map((classSession) => (
              <Button
                key={classSession.id}
                variant="outline"
                size="sm"
                onClick={() => openClass(classSession)}
              >
                {formatDate(classSession.date)} ({classSession.startTime} - {classSession.endTime})
              </Button>
            ))}
          </div>
        ) : attendanceMode.type === 'summary' ? (
          summary === null ? (
            <p className="text-muted-foreground">Cargando...</p>
          ) : summary.students.length === 0 ? (
            <p className="text-muted-foreground">No hay alumnos inscriptos todavía.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  {summary.students[0].attendance.map((_, index) => (
                    <TableHead key={index} className="text-center">
                      Clase {index + 1}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">%</TableHead>
                  <TableHead className="text-center">70%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.students.map((student) => (
                  <TableRow key={student.studentId}>
                    <TableCell>{student.fullName}</TableCell>
                    {student.attendance.map((entry, index) => (
                      <TableCell key={index} className="text-center">
                        {entry.present ? 'P' : 'A'}
                      </TableCell>
                    ))}
                    <TableCell className="text-center">{student.attendanceCount}</TableCell>
                    <TableCell className="text-center">{student.attendancePercentage}%</TableCell>
                    <TableCell className="text-center">
                      {student.meetsAttendanceRequirement ? '✅' : '❌'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {formatDate(attendanceMode.classSession.date)} ·{' '}
              {attendanceMode.classSession.startTime} - {attendanceMode.classSession.endTime}
            </p>
            {roster === null ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : roster.length === 0 ? (
              <p className="text-muted-foreground">No hay alumnos inscriptos en esta edición.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Presente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell>
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={student.present}
                          onChange={() => toggleStudent(student.studentId)}
                          className="size-4 rounded border-input"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={handleSaveAttendance} disabled={saving || roster === null}>
                Guardar asistencias
              </Button>
              {savedMessage && <p className="text-sm text-green-600">{savedMessage}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Evaluaciones</h2>
          {evaluationMode.type === 'closed' ? (
            <Button size="sm" onClick={openEvaluations}>
              Evaluaciones del curso
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEvaluationMode({ type: 'closed' })}
            >
              Cerrar
            </Button>
          )}
        </div>

        {evaluationMode.type === 'list' && (
          <div className="space-y-3">
            <Button size="sm" onClick={() => setEvaluationMode({ type: 'create' })}>
              Nueva evaluación
            </Button>
            {evaluations === null ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : evaluations.length === 0 ? (
              <p className="text-muted-foreground">
                Todavía no hay evaluaciones para esta edición.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell>{evaluation.name}</TableCell>
                      <TableCell>{EVALUATION_TYPE_LABELS[evaluation.type]}</TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button variant="outline" size="sm" onClick={() => openResults(evaluation)}>
                          Registrar resultados
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEvaluationMode({ type: 'edit', evaluation })}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteEvaluation(evaluation.id)}
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
        )}

        {evaluationMode.type === 'create' && (
          <EvaluationForm
            onSubmit={handleCreateEvaluation}
            onCancel={() => setEvaluationMode({ type: 'list' })}
          />
        )}

        {evaluationMode.type === 'edit' && (
          <EvaluationForm
            initialValues={evaluationMode.evaluation}
            onSubmit={(values) => handleUpdateEvaluation(evaluationMode.evaluation.id, values)}
            onCancel={() => setEvaluationMode({ type: 'list' })}
          />
        )}

        {evaluationMode.type === 'results' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">{evaluationMode.evaluation.name}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEvaluationMode({ type: 'list' })}
              >
                Volver
              </Button>
            </div>
            {results === null ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : results.length === 0 ? (
              <p className="text-muted-foreground">No hay alumnos inscriptos en esta edición.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell>
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-4">
                          {(['not-evaluated', 'passed', 'failed'] as const).map((status) => (
                            <label key={status} className="flex items-center gap-1 text-sm">
                              <input
                                type="radio"
                                name={`result-${student.studentId}`}
                                checked={student.status === status}
                                onChange={() => setResultStatus(student.studentId, status)}
                              />
                              {RESULT_STATUS_LABELS[status]}
                            </label>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={handleSaveResults}
                disabled={savingResults || results === null}
              >
                Guardar resultados
              </Button>
              {resultsSavedMessage && (
                <p className="text-sm text-green-600">{resultsSavedMessage}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
