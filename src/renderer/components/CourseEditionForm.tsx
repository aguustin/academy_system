import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import {
  courseEditionInputSchema,
  courseEditionStatusSchema,
  dayOfWeekSchema,
  type CourseEdition,
  type CourseEditionStatus,
  type CourseTemplate,
  type DayOfWeek,
  type Schedule
} from '../../shared/courses'
import { DEFAULT_MINIMUM_ATTENDANCE_PERCENTAGE } from '../../shared/attendance'
import type { Teacher } from '../../shared/teachers'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Card } from './ui/card'
import { FormField } from './ui/form-field'

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

const STATUS_LABELS: Record<CourseEditionStatus, string> = {
  upcoming: 'Próxima',
  active: 'Activa',
  finished: 'Finalizada'
}

function toDateInputValue(date: Date): string {
  return new Date(date).toISOString().slice(0, 10)
}

type CourseEditionFormValues = z.infer<typeof courseEditionInputSchema>

interface CourseEditionFormProps {
  initialValues?: CourseEdition
  teachers: Teacher[]
  courseTemplates: CourseTemplate[]
  onSubmit: (values: CourseEditionFormValues) => Promise<void>
  onCancel: () => void
}

export function CourseEditionForm({
  initialValues,
  teachers,
  courseTemplates,
  onSubmit,
  onCancel
}: CourseEditionFormProps): React.JSX.Element {
  const [templateId, setTemplateId] = useState(initialValues?.templateId ?? '')
  const [teacherId, setTeacherId] = useState(initialValues?.teacherId ?? '')
  const [startDate, setStartDate] = useState(
    initialValues ? toDateInputValue(initialValues.startDate) : ''
  )
  const [endDate, setEndDate] = useState(
    initialValues ? toDateInputValue(initialValues.endDate) : ''
  )
  const [status, setStatus] = useState<CourseEditionStatus>(initialValues?.status ?? 'upcoming')
  const [minimumAttendancePercentage, setMinimumAttendancePercentage] = useState(
    initialValues?.minimumAttendancePercentage ?? DEFAULT_MINIMUM_ATTENDANCE_PERCENTAGE
  )
  const [schedules, setSchedules] = useState<Schedule[]>(initialValues?.schedules ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function addSchedule(): void {
    setSchedules([...schedules, { dayOfWeek: 'monday', startTime: '18:00', endTime: '20:00' }])
  }

  function removeSchedule(index: number): void {
    setSchedules(schedules.filter((_, i) => i !== index))
  }

  function updateSchedule(index: number, patch: Partial<Schedule>): void {
    setSchedules(
      schedules.map((schedule, i) => (i === index ? { ...schedule, ...patch } : schedule))
    )
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()

    const result = courseEditionInputSchema.safeParse({
      templateId,
      teacherId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      schedules,
      status,
      minimumAttendancePercentage
    })

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
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="max-w-md p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField label="Curso" htmlFor="templateId" error={errors.templateId}>
          <Select
            id="templateId"
            required
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
          >
            <option value="" disabled>
              Seleccionar...
            </option>
            {courseTemplates.map((courseTemplate) => (
              <option key={courseTemplate.id} value={courseTemplate.id}>
                {courseTemplate.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Profesor" htmlFor="teacherId" error={errors.teacherId}>
          <Select
            id="teacherId"
            required
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
          >
            <option value="" disabled>
              Seleccionar...
            </option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.firstName} {teacher.lastName}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Fecha inicio" htmlFor="startDate" error={errors.startDate}>
          <Input
            id="startDate"
            type="date"
            required
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </FormField>

        <FormField label="Fecha fin" htmlFor="endDate" error={errors.endDate}>
          <Input
            id="endDate"
            type="date"
            required
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </FormField>

        <FormField label="Estado" htmlFor="status">
          <Select
            id="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as CourseEditionStatus)}
          >
            {courseEditionStatusSchema.options.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Porcentaje mínimo de asistencia"
          htmlFor="minimumAttendancePercentage"
          error={errors.minimumAttendancePercentage}
        >
          <Input
            id="minimumAttendancePercentage"
            type="number"
            min={0}
            max={100}
            required
            value={minimumAttendancePercentage}
            onChange={(event) => setMinimumAttendancePercentage(Number(event.target.value))}
          />
        </FormField>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Horarios</span>
          {schedules.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              {schedules.map((schedule, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={schedule.dayOfWeek}
                    onChange={(event) =>
                      updateSchedule(index, { dayOfWeek: event.target.value as DayOfWeek })
                    }
                  >
                    {dayOfWeekSchema.options.map((value) => (
                      <option key={value} value={value}>
                        {DAY_LABELS[value]}
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="time"
                    value={schedule.startTime}
                    onChange={(event) => updateSchedule(index, { startTime: event.target.value })}
                  />
                  <Input
                    type="time"
                    value={schedule.endTime}
                    onChange={(event) => updateSchedule(index, { endTime: event.target.value })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSchedule(index)}
                  >
                    Quitar
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button type="button" variant="outline" size="sm" onClick={addSchedule}>
            Agregar horario
          </Button>
          {errors.schedules && <p className="text-sm text-destructive">{errors.schedules}</p>}
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={submitting}>
            {initialValues ? 'Guardar' : 'Crear'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}
