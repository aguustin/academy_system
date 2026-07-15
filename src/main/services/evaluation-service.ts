import type {
  Evaluation,
  EvaluationResultEntry,
  EvaluationResults,
  EvaluationResultStudent
} from '../../shared/evaluations'
import type { EvaluationCreateInput, EvaluationUpdateInput } from '../../shared/electron-api'
import type { CourseEdition } from '../../shared/courses'
import { getSession } from '../auth/session'
import { findCourseEditionById } from '../db/course-edition'
import { listEnrollmentsByCourseEdition } from '../db/enrollment'
import { mongoStudentProvider } from '../providers/mongo-student-provider'
import {
  createEvaluation as createEvaluationInDb,
  deleteEvaluation as deleteEvaluationInDb,
  findEvaluationById,
  listEvaluationsByEdition,
  listStudentEvaluations as listStudentEvaluationsInDb,
  saveStudentEvaluations as saveStudentEvaluationsInDb,
  updateEvaluation as updateEvaluationInDb
} from '../db/evaluation'

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

function validateName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('El nombre de la evaluación no puede estar vacío')
  }
  return trimmed
}

async function assertNameNotDuplicated(
  courseEditionId: string,
  name: string,
  excludeId?: string
): Promise<void> {
  const existing = await listEvaluationsByEdition(courseEditionId)
  const duplicate = existing.some(
    (evaluation) =>
      evaluation.id !== excludeId && evaluation.name.toLowerCase() === name.toLowerCase()
  )
  if (duplicate) {
    throw new Error(`Ya existe una evaluación llamada "${name}" en esta edición`)
  }
}

export async function createEvaluation(data: EvaluationCreateInput): Promise<Evaluation> {
  const courseEdition = await resolveOwnedCourseEdition(data.courseEditionId)
  const name = validateName(data.name)
  await assertNameNotDuplicated(courseEdition.id, name)

  return createEvaluationInDb({ courseEditionId: courseEdition.id, type: data.type, name })
}

export async function updateEvaluation(
  id: string,
  data: EvaluationUpdateInput
): Promise<Evaluation | null> {
  const evaluation = await findEvaluationById(id)
  if (!evaluation) {
    throw new Error('Evaluación no encontrada')
  }

  await resolveOwnedCourseEdition(evaluation.courseEditionId)
  const name = validateName(data.name)
  await assertNameNotDuplicated(evaluation.courseEditionId, name, evaluation.id)

  return updateEvaluationInDb(id, { type: data.type, name })
}

export async function deleteEvaluation(id: string): Promise<void> {
  const evaluation = await findEvaluationById(id)
  if (!evaluation) {
    return
  }

  await resolveOwnedCourseEdition(evaluation.courseEditionId)
  await deleteEvaluationInDb(id)
}

export async function listEvaluations(courseEditionId: string): Promise<Evaluation[]> {
  const courseEdition = await resolveOwnedCourseEdition(courseEditionId)
  return listEvaluationsByEdition(courseEdition.id)
}

async function resolveOwnedEvaluation(
  evaluationId: string
): Promise<{ evaluation: Evaluation; courseEdition: CourseEdition }> {
  const evaluation = await findEvaluationById(evaluationId)
  if (!evaluation) {
    throw new Error('Evaluación no encontrada')
  }

  const courseEdition = await resolveOwnedCourseEdition(evaluation.courseEditionId)

  return { evaluation, courseEdition }
}

export async function getEvaluationResults(evaluationId: string): Promise<EvaluationResults> {
  const { evaluation, courseEdition } = await resolveOwnedEvaluation(evaluationId)

  const [enrollments, results] = await Promise.all([
    listEnrollmentsByCourseEdition(courseEdition.id),
    listStudentEvaluationsInDb(evaluationId)
  ])
  const resultByStudent = new Map(results.map((result) => [result.studentId, result]))

  const students: EvaluationResultStudent[] = []
  for (const enrollment of enrollments) {
    const student = await mongoStudentProvider.findById(enrollment.studentId)
    if (!student) continue
    const result = resultByStudent.get(student.id)
    students.push({
      studentId: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      status: !result ? 'not-evaluated' : result.passed ? 'passed' : 'failed'
    })
  }

  return { evaluation, students }
}

export async function saveEvaluationResults(
  evaluationId: string,
  results: EvaluationResultEntry[]
): Promise<EvaluationResults> {
  const { courseEdition } = await resolveOwnedEvaluation(evaluationId)

  const enrollments = await listEnrollmentsByCourseEdition(courseEdition.id)
  const enrolledStudentIds = new Set(enrollments.map((enrollment) => enrollment.studentId))
  for (const result of results) {
    if (!enrolledStudentIds.has(result.studentId)) {
      throw new Error('El alumno no está inscripto en esta edición')
    }
  }

  await saveStudentEvaluationsInDb(
    results.map((result) => ({
      evaluationId,
      studentId: result.studentId,
      passed: result.passed
    }))
  )

  return getEvaluationResults(evaluationId)
}
