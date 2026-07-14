import type { Student } from '../../shared/students'
import type { TeacherCourseDetail, TeacherCourseSummary } from '../../shared/electron-api'
import { getSession } from '../auth/session'
import { findCourseEditionById, getCourseEditions } from '../db/course-edition'
import { findCourseTemplateById } from '../db/course-template'
import { findTeacherById } from '../db/teacher'
import { listEnrollmentsByCourseEdition } from '../db/enrollment'
import { listClassSessionsByEdition } from './class-session-service'
import { mongoStudentProvider } from '../providers/mongo-student-provider'

export async function listMyCourses(): Promise<TeacherCourseSummary[]> {
  const teacherId = getSession()?.teacherId
  if (!teacherId) {
    return []
  }

  const myEditions = (await getCourseEditions()).filter(
    (courseEdition) => courseEdition.teacherId === teacherId
  )

  return Promise.all(
    myEditions.map(async (courseEdition) => {
      const [courseTemplate, enrollments, classSessions] = await Promise.all([
        findCourseTemplateById(courseEdition.templateId),
        listEnrollmentsByCourseEdition(courseEdition.id),
        listClassSessionsByEdition(courseEdition.id)
      ])
      return {
        courseEdition,
        courseTemplate,
        studentCount: enrollments.length,
        classSessionCount: classSessions.length
      }
    })
  )
}

export async function getCourseDetail(courseEditionId: string): Promise<TeacherCourseDetail> {
  const courseEdition = await findCourseEditionById(courseEditionId)
  if (!courseEdition) {
    throw new Error('Edición no encontrada')
  }

  const session = getSession()
  if (session?.role === 'teacher' && courseEdition.teacherId !== session.teacherId) {
    throw new Error('No tenés acceso a esta edición')
  }

  const [courseTemplate, teacher, enrollments, classSessions] = await Promise.all([
    findCourseTemplateById(courseEdition.templateId),
    findTeacherById(courseEdition.teacherId),
    listEnrollmentsByCourseEdition(courseEdition.id),
    listClassSessionsByEdition(courseEdition.id)
  ])

  const students = (
    await Promise.all(
      enrollments.map((enrollment) => mongoStudentProvider.findById(enrollment.studentId))
    )
  ).filter((student): student is Student => student !== null)

  return { courseEdition, courseTemplate, teacher, students, classSessions }
}
