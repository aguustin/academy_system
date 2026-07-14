import { z } from 'zod'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { registerAttendance } from '../services/attendance-service'
import {
  findAttendanceByCourseEdition,
  findAttendanceByCourseEditionAndDate,
  findAttendanceByStudent
} from '../db/attendance'
import { handleAuthenticated } from '../auth/require-session'

const idSchema = z.string()
const registerInputSchema = z.object({
  dni: z.string(),
  courseEditionId: z.string().optional()
})
const listInputSchema = z.object({
  courseEditionId: z.string(),
  date: z.date()
})

export function registerAttendanceIpc(): void {
  handleAuthenticated(IPC_CHANNELS.ATTENDANCE_REGISTER, (_event, data: unknown) => {
    const input = registerInputSchema.parse(data)
    return registerAttendance(input.dni, input.courseEditionId)
  })

  handleAuthenticated(
    IPC_CHANNELS.ATTENDANCE_FIND_BY_COURSE_EDITION,
    (_event, courseEditionId: unknown) => {
      return findAttendanceByCourseEdition(idSchema.parse(courseEditionId))
    }
  )

  handleAuthenticated(IPC_CHANNELS.ATTENDANCE_FIND_BY_STUDENT, (_event, studentId: unknown) => {
    return findAttendanceByStudent(idSchema.parse(studentId))
  })

  handleAuthenticated(IPC_CHANNELS.ATTENDANCE_LIST, (_event, data: unknown) => {
    const input = listInputSchema.parse(data)
    return findAttendanceByCourseEditionAndDate(input.courseEditionId, input.date)
  })
}
