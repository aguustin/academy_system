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
  teacherId: z.string().optional(),
  active: z.boolean()
})

const createUserInputSchema = userFieldsSchema
  .extend({ password: z.string().min(6) })
  .refine((data) => data.role !== 'teacher' || !!data.teacherId, {
    message: 'Debe seleccionar un profesor',
    path: ['teacherId']
  })

const updateUserInputSchema = userFieldsSchema.refine(
  (data) => data.role !== 'teacher' || !!data.teacherId,
  { message: 'Debe seleccionar un profesor', path: ['teacherId'] }
)

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
