import { z } from 'zod'

export const studentSchema = z.object({
  id: z.string(),
  dni: z.string(),
  firstName: z.string(),
  lastName: z.string()
})
export type Student = z.infer<typeof studentSchema>
