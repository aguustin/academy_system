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
import type { Teacher } from '../../shared/teachers'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'

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
      status
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
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="templateId" className="text-sm font-medium">
          Curso
        </label>
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
        {errors.templateId && <p className="text-sm text-destructive">{errors.templateId}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="teacherId" className="text-sm font-medium">
          Profesor
        </label>
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
        {errors.teacherId && <p className="text-sm text-destructive">{errors.teacherId}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="startDate" className="text-sm font-medium">
          Fecha inicio
        </label>
        <Input
          id="startDate"
          type="date"
          required
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
        {errors.startDate && <p className="text-sm text-destructive">{errors.startDate}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="endDate" className="text-sm font-medium">
          Fecha fin
        </label>
        <Input
          id="endDate"
          type="date"
          required
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
        />
        {errors.endDate && <p className="text-sm text-destructive">{errors.endDate}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="status" className="text-sm font-medium">
          Estado
        </label>
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
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Horarios</span>
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
            <Button type="button" variant="outline" size="sm" onClick={() => removeSchedule(index)}>
              Quitar
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addSchedule}>
          Agregar horario
        </Button>
        {errors.schedules && <p className="text-sm text-destructive">{errors.schedules}</p>}
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
