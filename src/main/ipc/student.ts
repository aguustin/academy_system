import { z } from 'zod'
import { studentSchema } from '../../shared/students'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { mongoStudentProvider } from '../providers/mongo-student-provider'
import { createStudent, deleteStudent, updateStudent } from '../services/student-service'
import { handleAuthenticated } from '../auth/require-session'
import { handleAdminOnly } from '../auth/require-admin'

const idSchema = z.string()
const studentInputSchema = studentSchema.omit({ id: true })

export function registerStudentIpc(): void {
  handleAuthenticated(IPC_CHANNELS.STUDENT_LIST, () => {
    return mongoStudentProvider.getAll()
  })

  handleAuthenticated(IPC_CHANNELS.STUDENT_GET_BY_ID, (_event, id: unknown) => {
    return mongoStudentProvider.findById(idSchema.parse(id))
  })

  handleAuthenticated(IPC_CHANNELS.STUDENT_FIND_BY_DNI, (_event, dni: unknown) => {
    return mongoStudentProvider.findByDni(idSchema.parse(dni))
  })

  handleAdminOnly(IPC_CHANNELS.STUDENT_CREATE, (_event, data: unknown) => {
    return createStudent(studentInputSchema.parse(data))
  })

  handleAdminOnly(IPC_CHANNELS.STUDENT_UPDATE, (_event, id: unknown, data: unknown) => {
    return updateStudent(idSchema.parse(id), studentInputSchema.parse(data))
  })

  handleAdminOnly(IPC_CHANNELS.STUDENT_DELETE, (_event, id: unknown) => {
    return deleteStudent(idSchema.parse(id))
  })
}
