import { z } from 'zod'
import { timeSchema } from './time'

export const attendanceStatusSchema = z.enum(['present', 'absent', 'justified'])
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>

export const attendanceRegisteredBySchema = z.enum(['system', 'teacher'])
export type AttendanceRegisteredBy = z.infer<typeof attendanceRegisteredBySchema>

export const attendanceSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  courseEditionId: z.string(),
  // Identifica la clase concreta a la que corresponde la asistencia: tanto el marcado manual
  // del administrador (Ticket 018) como el autoservicio del kiosco (Ticket 025) lo completan.
  // Queda opcional únicamente por compatibilidad con registros históricos anteriores.
  classSessionId: z.string().optional(),
  date: z.date(),
  time: timeSchema,
  status: attendanceStatusSchema,
  registeredBy: attendanceRegisteredBySchema,
  createdAt: z.date()
})
export type Attendance = z.infer<typeof attendanceSchema>

export interface StudentTodayClassOption {
  classSessionId: string
  courseEditionId: string
  courseName: string
  teacherName: string
  date: Date
  startTime: string
  endTime: string
}

export type FindStudentTodayClassesResult =
  | { status: 'student-not-found' }
  | { status: 'no-classes-today'; studentName: string }
  | { status: 'ok'; studentId: string; studentName: string; options: StudentTodayClassOption[] }

export type RegisterClassAttendanceResult =
  { status: 'registered' } | { status: 'already-registered' }

export interface ClassAttendanceStudent {
  studentId: string
  firstName: string
  lastName: string
  dni: string
  present: boolean
}

export interface ClassAttendanceEntry {
  studentId: string
  present: boolean
}

export interface AttendanceSummaryClassEntry {
  classSessionId: string
  present: boolean
}

export interface AttendanceSummaryStudent {
  studentId: string
  fullName: string
  attendanceCount: number
  attendancePercentage: number
  meetsAttendanceRequirement: boolean
  attendance: AttendanceSummaryClassEntry[]
}

export interface AttendanceSummary {
  totalClasses: number
  students: AttendanceSummaryStudent[]
}
