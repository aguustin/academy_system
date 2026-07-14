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
  date: z.date(),
  time: timeSchema,
  status: attendanceStatusSchema,
  registeredBy: attendanceRegisteredBySchema,
  createdAt: z.date()
})
export type Attendance = z.infer<typeof attendanceSchema>

export interface AttendanceEditionOption {
  courseEditionId: string
  courseName: string
}

export type RegisterAttendanceResult =
  | { status: 'registered'; studentName: string; courseName: string; time: string }
  | { status: 'select-edition'; studentName: string; options: AttendanceEditionOption[] }
  | { status: 'already-registered'; studentName: string; courseName: string }
  | { status: 'student-not-found' }
  | { status: 'no-active-enrollment'; studentName: string }
