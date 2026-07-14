import { z } from 'zod'
import { teacherSchema } from '../../shared/teachers'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import {
  createTeacher,
  deleteTeacher,
  findTeacherById,
  getTeachers,
  updateTeacher
} from '../db/teacher'
import { handleAuthenticated } from '../auth/require-session'

const idSchema = z.string()
const createTeacherInputSchema = teacherSchema.omit({ id: true, createdAt: true, updatedAt: true })
const updateTeacherInputSchema = createTeacherInputSchema.partial()

export function registerTeacherIpc(): void {
  handleAuthenticated(IPC_CHANNELS.TEACHER_CREATE, (_event, data: unknown) => {
    return createTeacher(createTeacherInputSchema.parse(data))
  })

  handleAuthenticated(IPC_CHANNELS.TEACHER_LIST, () => {
    return getTeachers()
  })

  handleAuthenticated(IPC_CHANNELS.TEACHER_GET_BY_ID, (_event, id: unknown) => {
    return findTeacherById(idSchema.parse(id))
  })

  handleAuthenticated(IPC_CHANNELS.TEACHER_UPDATE, (_event, id: unknown, data: unknown) => {
    return updateTeacher(idSchema.parse(id), updateTeacherInputSchema.parse(data))
  })

  handleAuthenticated(IPC_CHANNELS.TEACHER_DELETE, (_event, id: unknown) => {
    return deleteTeacher(idSchema.parse(id))
  })
}
