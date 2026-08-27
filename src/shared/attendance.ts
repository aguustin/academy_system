import { z } from 'zod'
import { timeSchema } from './time'

// El porcentaje mínimo de asistencia ahora es una propiedad de cada CourseEdition
// (minimumAttendancePercentage), no un valor único para todo el sistema. Esta constante solo
// sirve como valor por defecto al crear una edición nueva y como respaldo para ediciones
// guardadas antes de que el campo existiera (ver toCourseEdition en db/course-edition.ts).
export const DEFAULT_MINIMUM_ATTENDANCE_PERCENTAGE = 70

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

export type AttendanceFeedbackType = 'success' | 'warning' | 'failed'

export interface AttendanceFeedback {
  remainingAbsences: number
  allowedAbsences: number
  usedAbsences: number
  attendancePercentage: number
  meetsAttendanceRequirement: boolean
  feedbackMessage: string
  feedbackType: AttendanceFeedbackType
}

export type RegisterClassAttendanceResult =
  | { status: 'registered'; attendanceFeedback: AttendanceFeedback }
  | { status: 'already-registered' }

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

// 'lost': ya superó las faltas permitidas contando solo clases ya dictadas (perdió la regularidad).
// 'at-risk': todavía cumple, pero le queda 0 o 1 falta disponible antes de perderla.
export type StudentRiskLevel = 'lost' | 'at-risk'

export interface StudentAtRiskItem {
  studentId: string
  studentName: string
  dni: string
  courseEditionId: string
  courseName: string
  riskLevel: StudentRiskLevel
  usedAbsences: number
  allowedAbsences: number
  remainingAbsences: number
}
