import { z } from 'zod'
import { timeSchema } from './time'

export const classSessionSchema = z.object({
  id: z.string(),
  courseEditionId: z.string(),
  date: z.date(),
  startTime: timeSchema,
  endTime: timeSchema,
  createdAt: z.date()
})
export type ClassSession = z.infer<typeof classSessionSchema>

export type GenerateClassSessionsResult =
  | { status: 'generated'; sessions: ClassSession[] }
  | { status: 'already-exists'; sessions: ClassSession[] }

export const addClassSessionInputSchema = classSessionSchema.omit({ id: true, createdAt: true })
export type AddClassSessionInput = z.infer<typeof addClassSessionInputSchema>
