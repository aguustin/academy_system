import {
  MINIMUM_ATTENDANCE_PERCENTAGE,
  type Attendance,
  type AttendanceFeedback,
  type AttendanceFeedbackType,
  type AttendanceStatus,
  type AttendanceSummary,
  type AttendanceSummaryClassEntry,
  type ClassAttendanceEntry,
  type ClassAttendanceStudent,
  type FindStudentTodayClassesResult,
  type RegisterClassAttendanceResult,
  type StudentTodayClassOption
} from '../../shared/attendance'
import type { ClassSession } from '../../shared/class-sessions'
import type { CourseEdition } from '../../shared/courses'
import { mongoStudentProvider } from '../providers/mongo-student-provider'
import { findCourseEditionById } from '../db/course-edition'
import { findCourseTemplateById } from '../db/course-template'
import { findTeacherById } from '../db/teacher'
import { listEnrollmentsByCourseEdition, listEnrollmentsByStudent } from '../db/enrollment'
import { findClassSessionById } from '../db/class-session'
import { listClassSessionsByEdition } from './class-session-service'
import { getSession } from '../auth/session'
import {
  createAttendance,
  findAttendanceByClassSession,
  findAttendanceByClassSessionAndStudent,
  findAttendanceByCourseEdition,
  updateAttendance
} from '../db/attendance'

function isSameLocalDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function toLocalDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export interface AttendanceStats {
  totalClasses: number
  completedClasses: number
  attendanceCount: number
  allowedAbsences: number
  usedAbsences: number
  remainingAbsences: number
  attendancePercentage: number
  meetsAttendanceRequirement: boolean
}

// Núcleo de cálculo reutilizable: recibe datos ya obtenidos (sin volver a consultar Mongo) para
// poder reutilizarse tanto para un único alumno (kiosco), en el resumen de toda la edición, como
// en la exportación a Excel (course-edition-export-service.ts).
export function computeAttendanceStats(
  classSessions: ClassSession[],
  attendanceRecords: Attendance[],
  studentId: string,
  today: Date = new Date()
): AttendanceStats {
  const totalClasses = classSessions.length
  const todayLocal = toLocalDateOnly(today)
  const completedClasses = classSessions.filter(
    (session) => toLocalDateOnly(session.date) <= todayLocal
  ).length

  const attendanceCount = attendanceRecords.filter(
    (record) => record.studentId === studentId && record.status === 'present'
  ).length

  const allowedAbsences = Math.floor(totalClasses * (1 - MINIMUM_ATTENDANCE_PERCENTAGE / 100))
  const usedAbsences = Math.max(0, completedClasses - attendanceCount)
  const remainingAbsences = Math.max(0, allowedAbsences - usedAbsences)
  const attendancePercentage =
    totalClasses === 0 ? 0 : Math.round((attendanceCount / totalClasses) * 100)

  return {
    totalClasses,
    completedClasses,
    attendanceCount,
    allowedAbsences,
    usedAbsences,
    remainingAbsences,
    attendancePercentage,
    meetsAttendanceRequirement: attendancePercentage >= MINIMUM_ATTENDANCE_PERCENTAGE
  }
}

// Reutilizable por certificaciones y reportes: calcula las estadísticas de asistencia de un
// alumno en una edición sin necesidad de conocer cómo se obtienen las clases o los registros.
export async function getStudentAttendanceStats(
  courseEditionId: string,
  studentId: string
): Promise<AttendanceStats> {
  const [classSessions, attendanceRecords] = await Promise.all([
    listClassSessionsByEdition(courseEditionId),
    findAttendanceByCourseEdition(courseEditionId)
  ])
  return computeAttendanceStats(classSessions, attendanceRecords, studentId)
}

function buildAttendanceFeedback(stats: AttendanceStats): AttendanceFeedback {
  let feedbackType: AttendanceFeedbackType
  let feedbackMessage: string

  if (!stats.meetsAttendanceRequirement) {
    feedbackType = 'failed'
    feedbackMessage = `Tenés ${stats.attendanceCount} asistencias de ${stats.totalClasses} clases.`
  } else if (stats.remainingAbsences === 0) {
    feedbackType = 'warning'
    feedbackMessage =
      'A partir de este momento ya no tenés más faltas disponibles. Cualquier nueva ausencia hará que pierdas la condición de asistencia.'
  } else {
    feedbackType = 'success'
    const classWord = stats.remainingAbsences === 1 ? 'clase' : 'clases'
    feedbackMessage = `Todavía podés faltar ${stats.remainingAbsences} ${classWord} sin perder la regularidad.`
  }

  return {
    remainingAbsences: stats.remainingAbsences,
    allowedAbsences: stats.allowedAbsences,
    usedAbsences: stats.usedAbsences,
    attendancePercentage: stats.attendancePercentage,
    meetsAttendanceRequirement: stats.meetsAttendanceRequirement,
    feedbackMessage,
    feedbackType
  }
}

export async function findStudentTodayClasses(dni: string): Promise<FindStudentTodayClassesResult> {
  const student = await mongoStudentProvider.findByDni(dni)
  if (!student) {
    return { status: 'student-not-found' }
  }

  const studentName = `${student.firstName} ${student.lastName}`
  const today = new Date()
  const enrollments = await listEnrollmentsByStudent(student.id)

  const options: StudentTodayClassOption[] = []
  for (const enrollment of enrollments) {
    const courseEdition = await findCourseEditionById(enrollment.courseEditionId)
    if (!courseEdition) continue

    const classSessions = await listClassSessionsByEdition(courseEdition.id)
    const todaySessions = classSessions.filter((session) => isSameLocalDate(session.date, today))
    if (todaySessions.length === 0) continue

    const [courseTemplate, teacher] = await Promise.all([
      findCourseTemplateById(courseEdition.templateId),
      findTeacherById(courseEdition.teacherId)
    ])

    for (const classSession of todaySessions) {
      options.push({
        classSessionId: classSession.id,
        courseEditionId: courseEdition.id,
        courseName: courseTemplate?.name ?? courseEdition.templateId,
        teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : '—',
        date: classSession.date,
        startTime: classSession.startTime,
        endTime: classSession.endTime
      })
    }
  }

  if (options.length === 0) {
    return { status: 'no-classes-today', studentName }
  }

  return { status: 'ok', studentId: student.id, studentName, options }
}

export async function registerClassAttendance(
  classSessionId: string,
  studentId: string
): Promise<RegisterClassAttendanceResult> {
  const classSession = await findClassSessionById(classSessionId)
  if (!classSession) {
    throw new Error('Clase no encontrada')
  }

  // Nunca confiar en los IDs que llegan desde el kiosco: se revalida la inscripción en el backend.
  const enrollments = await listEnrollmentsByCourseEdition(classSession.courseEditionId)
  const isEnrolled = enrollments.some((enrollment) => enrollment.studentId === studentId)
  if (!isEnrolled) {
    throw new Error('El alumno no está inscripto en esta edición')
  }

  const existing = await findAttendanceByClassSessionAndStudent(classSessionId, studentId)
  if (existing) {
    return { status: 'already-registered' }
  }

  await createAttendance({
    studentId,
    courseEditionId: classSession.courseEditionId,
    classSessionId,
    date: classSession.date,
    time: classSession.startTime,
    status: 'present',
    registeredBy: 'system'
  })

  const stats = await getStudentAttendanceStats(classSession.courseEditionId, studentId)
  return { status: 'registered', attendanceFeedback: buildAttendanceFeedback(stats) }
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

        const stats = computeAttendanceStats(classSessions, attendanceRecords, student.id)

        return {
          studentId: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          attendanceCount: stats.attendanceCount,
          attendancePercentage: stats.attendancePercentage,
          meetsAttendanceRequirement: stats.meetsAttendanceRequirement,
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
