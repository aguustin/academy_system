import { z } from 'zod'

export const enrollmentSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  courseEditionId: z.string(),
  createdAt: z.date()
})
export type Enrollment = z.infer<typeof enrollmentSchema>
