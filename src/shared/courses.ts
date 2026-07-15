import { z } from 'zod'
import { timeSchema } from './time'

export const courseTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  active: z.boolean(),
  // Ruta relativa (dentro de userData/programs) del archivo del programa. El archivo en sí nunca se guarda en Mongo.
  programFile: z.string().nullable().default(null),
  createdAt: z.date(),
  updatedAt: z.date()
})
export type CourseTemplate = z.infer<typeof courseTemplateSchema>

export const dayOfWeekSchema = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
])
export type DayOfWeek = z.infer<typeof dayOfWeekSchema>

export const scheduleSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  startTime: timeSchema,
  endTime: timeSchema
})
export type Schedule = z.infer<typeof scheduleSchema>

export const courseEditionStatusSchema = z.enum(['upcoming', 'active', 'finished'])
export type CourseEditionStatus = z.infer<typeof courseEditionStatusSchema>

export const courseEditionSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  teacherId: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  schedules: z.array(scheduleSchema),
  status: courseEditionStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date()
})
export type CourseEdition = z.infer<typeof courseEditionSchema>

export const courseEditionInputSchema = courseEditionSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'La fecha de fin debe ser igual o posterior a la fecha de inicio',
    path: ['endDate']
  })
  .refine((data) => data.schedules.length > 0, {
    message: 'Debe existir al menos un horario',
    path: ['schedules']
  })
export type CourseEditionInput = z.infer<typeof courseEditionInputSchema>
