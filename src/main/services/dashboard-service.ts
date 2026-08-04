import type {
  AttentionEditionItem,
  AttentionEvaluationItem,
  DashboardSummary,
  UpcomingClassItem
} from '../../shared/dashboard'
import { getCourseEditions } from '../db/course-edition'
import { getCourseTemplates } from '../db/course-template'
import { listEnrollmentsByCourseEdition } from '../db/enrollment'
import { mongoStudentProvider } from '../providers/mongo-student-provider'
import { listClassSessionsByEdition } from './class-session-service'
import { getEvaluationResults, listEvaluations } from './evaluation-service'

const UPCOMING_DAYS = 7

function toLocalDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// Solo se revisan las ediciones activas: una edición "próxima" es normal que todavía no tenga
// clases generadas ni alumnos inscriptos, así que no tiene sentido señalarla como pendiente.
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [editions, templates, students] = await Promise.all([
    getCourseEditions(),
    getCourseTemplates(),
    mongoStudentProvider.getAll()
  ])
  const templateNameById = new Map(templates.map((template) => [template.id, template.name]))
  const courseName = (templateId: string): string => templateNameById.get(templateId) ?? templateId

  const activeEditions = editions.filter((edition) => edition.status === 'active')
  const upcomingEditions = editions.filter((edition) => edition.status === 'upcoming')
  const finishedEditions = editions.filter((edition) => edition.status === 'finished')

  const todayLocal = toLocalDateOnly(new Date())
  const upcomingLimit = toLocalDateOnly(new Date())
  upcomingLimit.setDate(upcomingLimit.getDate() + UPCOMING_DAYS)

  const editionsWithoutClasses: AttentionEditionItem[] = []
  const editionsWithoutStudents: AttentionEditionItem[] = []
  const evaluationsWithoutResults: AttentionEvaluationItem[] = []
  const classesThisWeek: UpcomingClassItem[] = []

  for (const edition of activeEditions) {
    const [classSessions, enrollments, evaluations] = await Promise.all([
      listClassSessionsByEdition(edition.id),
      listEnrollmentsByCourseEdition(edition.id),
      listEvaluations(edition.id)
    ])
    const name = courseName(edition.templateId)

    if (classSessions.length === 0) {
      editionsWithoutClasses.push({ courseEditionId: edition.id, courseName: name })
    }
    if (enrollments.length === 0) {
      editionsWithoutStudents.push({ courseEditionId: edition.id, courseName: name })
    }

    for (const classSession of classSessions) {
      const classDateLocal = toLocalDateOnly(classSession.date)
      if (classDateLocal >= todayLocal && classDateLocal <= upcomingLimit) {
        classesThisWeek.push({
          classSessionId: classSession.id,
          courseEditionId: edition.id,
          courseName: name,
          date: classSession.date,
          startTime: classSession.startTime,
          endTime: classSession.endTime
        })
      }
    }

    for (const evaluation of evaluations) {
      const results = await getEvaluationResults(evaluation.id)
      const hasAnyGrade = results.students.some((student) => student.grade !== null)
      if (!hasAnyGrade) {
        evaluationsWithoutResults.push({
          evaluationId: evaluation.id,
          evaluationName: evaluation.name,
          courseEditionId: edition.id,
          courseName: name
        })
      }
    }
  }

  classesThisWeek.sort((a, b) => a.date.getTime() - b.date.getTime())

  return {
    activeEditionsCount: activeEditions.length,
    upcomingEditionsCount: upcomingEditions.length,
    finishedEditionsCount: finishedEditions.length,
    totalStudentsCount: students.length,
    editionsWithoutClasses,
    editionsWithoutStudents,
    evaluationsWithoutResults,
    classesThisWeek
  }
}
