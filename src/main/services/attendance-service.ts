import type { AttendanceEditionOption, RegisterAttendanceResult } from '../../shared/attendance'
import { mongoStudentProvider } from '../providers/mongo-student-provider'
import { findCourseEditionById } from '../db/course-edition'
import { findCourseTemplateById } from '../db/course-template'
import { listEnrollmentsByStudent } from '../db/enrollment'
import { createAttendance, findAttendanceForToday } from '../db/attendance'

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
