import { z } from 'zod'

export const userRoleSchema = z.enum(['admin', 'teacher'])
export type UserRole = z.infer<typeof userRoleSchema>

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string(),
  email: z.email(),
  role: userRoleSchema,
  // Solo tiene valor cuando role === 'teacher': vincula el usuario con su Docente.
  teacherId: z.string().optional(),
  mustChangePassword: z.boolean(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
})
export type User = z.infer<typeof userSchema>
