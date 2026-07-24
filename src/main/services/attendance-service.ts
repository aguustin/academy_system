import type {
  AttendanceEditionOption,
  AttendanceStatus,
  AttendanceSummary,
  AttendanceSummaryClassEntry,
  ClassAttendanceEntry,
  ClassAttendanceStudent,
  RegisterAttendanceResult
} from '../../shared/attendance'
import type { ClassSession } from '../../shared/class-sessions'
import type { CourseEdition } from '../../shared/courses'
import { mongoStudentProvider } from '../providers/mongo-student-provider'
import { findCourseEditionById } from '../db/course-edition'
import { findCourseTemplateById } from '../db/course-template'
import { listEnrollmentsByCourseEdition, listEnrollmentsByStudent } from '../db/enrollment'
import { findClassSessionById } from '../db/class-session'
import { listClassSessionsByEdition } from './class-session-service'
import { getSession } from '../auth/session'
import {
  createAttendance,
  findAttendanceByClassSession,
  findAttendanceByClassSessionAndStudent,
  findAttendanceByCourseEdition,
  findAttendanceForToday,
  updateAttendance
} from '../db/attendance'

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

async function findActiveEditions(studentId: string): Promise<AttendanceEditionOption[]> {
  const enrollments = await listEnrollmentsByStudent(studentId)
  const options: AttendanceEditionOption[] = []

  for (const enrollment of enrollments) {
    const edition = await findCourseEditionById(enrollment.courseEditionId)
    if (!edition || edition.status !== 'active') continue

    const template = await findCourseTemplateById(edition.templateId)
    options.push({ courseEditionId: edition.id, courseName: template?.name ?? edition.templateId })
  }

  return options
}

export async function registerAttendance(
  dni: string,
  courseEditionId?: string
): Promise<RegisterAttendanceResult> {
  const student = await mongoStudentProvider.findByDni(dni)
  if (!student) {
    return { status: 'student-not-found' }
  }

  const studentName = `${student.firstName} ${student.lastName}`
  const activeEditions = await findActiveEditions(student.id)

  if (activeEditions.length === 0) {
    return { status: 'no-active-enrollment', studentName }
  }

  let target = activeEditions[0]
  if (activeEditions.length > 1) {
    const chosen = activeEditions.find((option) => option.courseEditionId === courseEditionId)
    if (!chosen) {
      return { status: 'select-edition', studentName, options: activeEditions }
    }
    target = chosen
  }

  const existing = await findAttendanceForToday(student.id, target.courseEditionId)
  if (existing) {
    return { status: 'already-registered', studentName, courseName: target.courseName }
  }

  const now = new Date()
  await createAttendance({
    studentId: student.id,
    courseEditionId: target.courseEditionId,
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    time: formatTime(now),
    status: 'present',
    registeredBy: 'system'
  })

  return { status: 'registered', studentName, courseName: target.courseName, time: formatTime(now) }
}

async function resolveOwnedCourseEdition(courseEditionId: string): Promise<CourseEdition> {
  const courseEdition = await findCourseEditionById(courseEditionId)
  if (!courseEdition) {
    throw new Error('Edición no encontrada')
  }

  const session = getSession()
  if (session?.role === 'teacher' && courseEdition.teacherId !== session.teacherId) {
    throw new Error('No tenés acceso a esta edición')
  }

  return courseEdition
}

async function resolveOwnedClassSession(
  classSessionId: string
): Promise<{ classSession: ClassSession; courseEdition: CourseEdition }> {
  const classSession = await findClassSessionById(classSessionId)
  if (!classSession) {
    throw new Error('Clase no encontrada')
  }

  const courseEdition = await resolveOwnedCourseEdition(classSession.courseEditionId)

  return { classSession, courseEdition }
}

export async function listAttendanceByClass(
  classSessionId: string
): Promise<ClassAttendanceStudent[]> {
  const { classSession } = await resolveOwnedClassSession(classSessionId)

  const [enrollments, attendanceRecords] = await Promise.all([
    listEnrollmentsByCourseEdition(classSession.courseEditionId),
    findAttendanceByClassSession(classSessionId)
  ])
  const attendanceByStudent = new Map(attendanceRecords.map((record) => [record.studentId, record]))

  const roster: ClassAttendanceStudent[] = []
  for (const enrollment of enrollments) {
    const student = await mongoStudentProvider.findById(enrollment.studentId)
    if (!student) continue
    roster.push({
      studentId: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      dni: student.dni,
      present: attendanceByStudent.get(student.id)?.status === 'present'
    })
  }

  return roster
}

export async function saveClassAttendance(
  classSessionId: string,
  entries: ClassAttendanceEntry[]
): Promise<ClassAttendanceStudent[]> {
  // Ticket 028: la carga de asistencias pasa a ser responsabilidad exclusiva del administrador.
  if (getSession()?.role === 'teacher') {
    throw new Error('No tenés permisos para registrar asistencias')
  }

  const { classSession, courseEdition } = await resolveOwnedClassSession(classSessionId)

  const enrollments = await listEnrollmentsByCourseEdition(courseEdition.id)
  const enrolledStudentIds = new Set(enrollments.map((enrollment) => enrollment.studentId))
  for (const entry of entries) {
    if (!enrolledStudentIds.has(entry.studentId)) {
      throw new Error('El alumno no está inscripto en esta edición')
    }
  }

  for (const entry of entries) {
    const status = entry.present ? 'present' : 'absent'
    const existing = await findAttendanceByClassSessionAndStudent(classSessionId, entry.studentId)
    if (existing) {
      await updateAttendance(existing.id, { status })
    } else {
      await createAttendance({
        studentId: entry.studentId,
        courseEditionId: courseEdition.id,
        classSessionId,
        date: classSession.date,
        time: classSession.startTime,
        status,
        registeredBy: 'teacher'
      })
    }
  }

  return listAttendanceByClass(classSessionId)
}

export async function getAttendanceSummary(courseEditionId: string): Promise<AttendanceSummary> {
  const courseEdition = await resolveOwnedCourseEdition(courseEditionId)

  const [classSessions, enrollments, attendanceRecords] = await Promise.all([
    listClassSessionsByEdition(courseEdition.id),
    listEnrollmentsByCourseEdition(courseEdition.id),
    findAttendanceByCourseEdition(courseEdition.id)
  ])

  const attendanceByStudent = new Map<string, Map<string, AttendanceStatus>>()
  for (const record of attendanceRecords) {
    if (!record.classSessionId) continue
    const byClass = attendanceByStudent.get(record.studentId) ?? new Map<string, AttendanceStatus>()
    byClass.set(record.classSessionId, record.status)
    attendanceByStudent.set(record.studentId, byClass)
  }

  const totalClasses = classSessions.length

  const drafts = (
    await Promise.all(
      enrollments.map(async (enrollment) => {
        const student = await mongoStudentProvider.findById(enrollment.studentId)
        if (!student) return null

        const byClass = attendanceByStudent.get(student.id)
        const attendance: AttendanceSummaryClassEntry[] = classSessions.map((classSession) => ({
          classSessionId: classSession.id,
          present: byClass?.get(classSession.id) === 'present'
        }))

        const attendanceCount = attendance.filter((entry) => entry.present).length
        const attendancePercentage =
          totalClasses === 0 ? 0 : Math.round((attendanceCount / totalClasses) * 100)

        return {
          studentId: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          attendanceCount,
          attendancePercentage,
          meetsAttendanceRequirement: attendancePercentage >= 70,
          attendance
        }
      })
    )
  ).filter((draft): draft is NonNullable<typeof draft> => draft !== null)

  drafts.sort((a, b) => {
    const lastNameComparison = a.lastName.localeCompare(b.lastName, 'es')
    return lastNameComparison !== 0
      ? lastNameComparison
      : a.firstName.localeCompare(b.firstName, 'es')
  })

  const students = drafts.map((draft) => ({
    studentId: draft.studentId,
    fullName: `${draft.firstName} ${draft.lastName}`,
    attendanceCount: draft.attendanceCount,
    attendancePercentage: draft.attendancePercentage,
    meetsAttendanceRequirement: draft.meetsAttendanceRequirement,
    attendance: draft.attendance
  }))

  return { totalClasses, students }
}
