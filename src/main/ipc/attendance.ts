import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import {
  findStudentTodayClasses,
  getAttendanceSummary,
  listAttendanceByClass,
  registerClassAttendance,
  saveClassAttendance
} from '../services/attendance-service'
import {
  findAttendanceByCourseEdition,
  findAttendanceByCourseEditionAndDate,
  findAttendanceByStudent
} from '../db/attendance'
import { handleAuthenticated } from '../auth/require-session'

const idSchema = z.string()
const registerClassInputSchema = z.object({
  classSessionId: z.string(),
  studentId: z.string()
})
const listInputSchema = z.object({
  courseEditionId: z.string(),
  date: z.date()
})
const saveClassAttendanceInputSchema = z.object({
  classSessionId: z.string(),
  entries: z.array(
    z.object({
      studentId: z.string(),
      present: z.boolean()
    })
  )
})

export function registerAttendanceIpc(): void {
  // Kiosco de autoservicio: se usa sin sesión iniciada (Ticket 025), igual que auth:login.
  ipcMain.handle(IPC_CHANNELS.ATTENDANCE_FIND_TODAY_CLASSES, (_event, dni: unknown) => {
    return findStudentTodayClasses(idSchema.parse(dni))
  })

  ipcMain.handle(IPC_CHANNELS.ATTENDANCE_REGISTER_CLASS, (_event, data: unknown) => {
    const input = registerClassInputSchema.parse(data)
    return registerClassAttendance(input.classSessionId, input.studentId)
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

  handleAuthenticated(IPC_CHANNELS.ATTENDANCE_SAVE_CLASS_ATTENDANCE, (_event, data: unknown) => {
    const input = saveClassAttendanceInputSchema.parse(data)
    return saveClassAttendance(input.classSessionId, input.entries)
  })

  handleAuthenticated(IPC_CHANNELS.ATTENDANCE_LIST_BY_CLASS, (_event, classSessionId: unknown) => {
    return listAttendanceByClass(idSchema.parse(classSessionId))
  })

  handleAuthenticated(IPC_CHANNELS.ATTENDANCE_GET_SUMMARY, (_event, courseEditionId: unknown) => {
    return getAttendanceSummary(idSchema.parse(courseEditionId))
  })
}
