import { z } from 'zod'

export const teacherSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dni: z.string(),
  email: z.email(),
  phone: z.string(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
})
export type Teacher = z.infer<typeof teacherSchema>
