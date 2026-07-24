import { z } from 'zod'
import { userRoleSchema } from '../../shared/users'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import {
  createUser,
  deleteUser,
  listUsers,
  resetPassword,
  updateUser
} from '../services/user-service'
import { handleAdminOnly } from '../auth/require-admin'

const idSchema = z.string()

const userFieldsSchema = z.object({
  username: z.string().min(1),
  email: z.email(),
  role: userRoleSchema,
  active: z.boolean(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dni: z.string().optional(),
  phone: z.string().optional()
})

function checkTeacherFields(data: z.infer<typeof userFieldsSchema>, ctx: z.RefinementCtx): void {
  if (data.role !== 'teacher') return
  if (!data.firstName?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'El nombre es obligatorio', path: ['firstName'] })
  }
  if (!data.lastName?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'El apellido es obligatorio', path: ['lastName'] })
  }
  if (!data.dni?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'El DNI es obligatorio', path: ['dni'] })
  }
  if (!data.phone?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'El teléfono es obligatorio', path: ['phone'] })
  }
}

const createUserInputSchema = userFieldsSchema
  .extend({ password: z.string().min(6) })
  .superRefine(checkTeacherFields)

const updateUserInputSchema = userFieldsSchema.superRefine(checkTeacherFields)

export function registerUserIpc(): void {
  handleAdminOnly(IPC_CHANNELS.USER_LIST, () => {
    return listUsers()
  })

  handleAdminOnly(IPC_CHANNELS.USER_CREATE, (_event, data: unknown) => {
    return createUser(createUserInputSchema.parse(data))
  })

  handleAdminOnly(IPC_CHANNELS.USER_UPDATE, (_event, id: unknown, data: unknown) => {
    return updateUser(idSchema.parse(id), updateUserInputSchema.parse(data))
  })

  handleAdminOnly(IPC_CHANNELS.USER_DELETE, (_event, id: unknown) => {
    return deleteUser(idSchema.parse(id))
  })

  handleAdminOnly(IPC_CHANNELS.USER_RESET_PASSWORD, (_event, id: unknown) => {
    return resetPassword(idSchema.parse(id))
  })
}
