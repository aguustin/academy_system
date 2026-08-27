import {
  evaluationStatusFromGrade,
  type Evaluation,
  type FinalEvaluationInfo
} from '../../shared/evaluations'
import type {
  CertificationEvaluationStatus,
  CourseEditionAcademicSummary,
  CourseEditionAcademicSummaryStudent,
  StudentCertification,
  StudentCertificationEvaluation
} from '../../shared/electron-api'
import type { AcademicStatus } from '../../shared/evaluations'
import { getCourseDetail } from './teacher-course-service'
import { computeAttendanceStats, getAttendanceSummary } from './attendance-service'
import { listEvaluations } from './evaluation-service'
import { findAttendanceByCourseEdition } from '../db/attendance'
import { findCourseEditionById } from '../db/course-edition'
import { listStudentEvaluationsByEvaluationIds } from '../db/evaluation'

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export interface AcademicSummaryResult {
  processAverageGrade: number | null
  academicStatus: AcademicStatus
}

// Núcleo de cálculo reutilizable (certificación individual, resumen de toda la edición y
// exportación a Excel): la nota final NUNCA se promedia con las de proceso (Requerimiento 2).
//
// Mientras la edición no terminó y la asistencia todavía es recuperable, no corresponde
// determinar la aprobación final (Requerimiento 5) -> 'in-progress'. La única excepción es
// cuando la asistencia ya quedó irrecuperable (usedAbsences > allowedAbsences, el mismo cálculo
// que ya usa "Alumnos en riesgo"): ahí corresponde desaprobar de inmediato aunque siga cursando.
export function computeAcademicSummary(params: {
  attendancePercentage: number
  attendanceIrrecoverable: boolean
  minimumAttendancePercentage: number
  courseEditionFinished: boolean
  processGrades: number[]
  // undefined = no existe evaluación final en la edición; null = existe pero sin nota cargada.
  finalEvaluationGrade: number | null | undefined
}): AcademicSummaryResult {
  const processAverageGrade =
    params.processGrades.length === 0
      ? null
      : round(
          params.processGrades.reduce((sum, grade) => sum + grade, 0) / params.processGrades.length,
          2
        )

  if (!params.courseEditionFinished && !params.attendanceIrrecoverable) {
    return { processAverageGrade, academicStatus: 'in-progress' }
  }

  const attendanceOk =
    !params.attendanceIrrecoverable &&
    params.attendancePercentage >= params.minimumAttendancePercentage
  const processOk = processAverageGrade !== null && processAverageGrade >= 7
  const finalOk =
    params.finalEvaluationGrade === undefined
      ? true
      : params.finalEvaluationGrade !== null && params.finalEvaluationGrade >= 7

  return {
    processAverageGrade,
    academicStatus: attendanceOk && processOk && finalOk ? 'approved' : 'failed'
  }
}

export interface EditionEvaluationData {
  evaluations: Evaluation[]
  finalEvaluation: Evaluation | null
  // studentId -> evaluationId -> nota
  gradesByStudent: Map<string, Map<string, number>>
}

// Trae de una sola vez las evaluaciones y notas de toda la edición: la usan tanto la
// certificación de un alumno como el resumen de toda la edición (Requerimiento 7) y la
// exportación a Excel (Requerimiento 8), sin repetir una consulta por evaluación.
export async function loadEditionEvaluationData(
  courseEditionId: string
): Promise<EditionEvaluationData> {
  const evaluations = await listEvaluations(courseEditionId)
  const finalEvaluation = evaluations.find((evaluation) => evaluation.type === 'final') ?? null
  const studentEvaluations = await listStudentEvaluationsByEvaluationIds(
    evaluations.map((evaluation) => evaluation.id)
  )

  const gradesByStudent = new Map<string, Map<string, number>>()
  for (const studentEvaluation of studentEvaluations) {
    const byEvaluation =
      gradesByStudent.get(studentEvaluation.studentId) ?? new Map<string, number>()
    byEvaluation.set(studentEvaluation.evaluationId, studentEvaluation.grade)
    gradesByStudent.set(studentEvaluation.studentId, byEvaluation)
  }

  return { evaluations, finalEvaluation, gradesByStudent }
}

export interface StudentGrades {
  processGrades: number[]
  finalEvaluationGrade: number | null | undefined
  finalEvaluation: FinalEvaluationInfo | null
}

export function extractStudentGrades(
  data: EditionEvaluationData,
  studentId: string
): StudentGrades {
  const byEvaluation = data.gradesByStudent.get(studentId) ?? new Map<string, number>()

  const processGrades = data.evaluations
    .filter((evaluation) => evaluation.type === 'process')
    .map((evaluation) => byEvaluation.get(evaluation.id))
    .filter((grade): grade is number => grade !== undefined)

  const finalEvaluationGrade = data.finalEvaluation
    ? (byEvaluation.get(data.finalEvaluation.id) ?? null)
    : undefined
  const finalEvaluation: FinalEvaluationInfo | null = data.finalEvaluation
    ? {
        id: data.finalEvaluation.id,
        name: data.finalEvaluation.name,
        grade: finalEvaluationGrade ?? null
      }
    : null

  return { processGrades, finalEvaluationGrade, finalEvaluation }
}

function toCertificationEvaluationStatus(grade: number | null): CertificationEvaluationStatus {
  const status = evaluationStatusFromGrade(grade)
  return status === 'passed' ? 'approved' : status === 'failed' ? 'failed' : 'pending'
}

export async function getStudentCertification(
  courseEditionId: string,
  studentId: string
): Promise<StudentCertification> {
  const detail = await getCourseDetail(courseEditionId)

  const student = detail.students.find((candidate) => candidate.id === studentId)
  if (!student) {
    throw new Error('El alumno no está inscripto en esta edición')
  }

  const [attendanceRecords, evaluationData] = await Promise.all([
    findAttendanceByCourseEdition(courseEditionId),
    loadEditionEvaluationData(courseEditionId)
  ])

  const attendanceStats = computeAttendanceStats(
    detail.classSessions,
    attendanceRecords,
    studentId,
    detail.courseEdition.minimumAttendancePercentage
  )

  const { processGrades, finalEvaluationGrade, finalEvaluation } = extractStudentGrades(
    evaluationData,
    studentId
  )

  const { processAverageGrade, academicStatus } = computeAcademicSummary({
    attendancePercentage: attendanceStats.attendancePercentage,
    attendanceIrrecoverable: attendanceStats.usedAbsences > attendanceStats.allowedAbsences,
    minimumAttendancePercentage: detail.courseEdition.minimumAttendancePercentage,
    courseEditionFinished: detail.courseEdition.status === 'finished',
    processGrades,
    finalEvaluationGrade
  })

  const gradesByEvaluation =
    evaluationData.gradesByStudent.get(studentId) ?? new Map<string, number>()
  const evaluationDetails: StudentCertificationEvaluation[] = evaluationData.evaluations.map(
    (evaluation) => {
      const grade = gradesByEvaluation.get(evaluation.id) ?? null
      return {
        id: evaluation.id,
        name: evaluation.name,
        type: evaluation.type,
        grade,
        status: toCertificationEvaluationStatus(grade)
      }
    }
  )

  return {
    student,
    totalClasses: attendanceStats.totalClasses,
    attendanceCount: attendanceStats.attendanceCount,
    attendancePercentage: attendanceStats.attendancePercentage,
    attendanceApproved: attendanceStats.meetsAttendanceRequirement,
    processAverageGrade,
    finalEvaluation,
    academicStatus,
    evaluations: evaluationDetails
  }
}

// Extiende "Ver total de asistencias" (Requerimiento 7) con nota final y situación académica.
// Reutiliza getAttendanceSummary tal cual (misma grilla P/A por clase, mismo orden por apellido)
// en vez de recalcularla, y le agrega lo que le falta para derivar el estado académico.
export async function getCourseEditionAcademicSummary(
  courseEditionId: string
): Promise<CourseEditionAcademicSummary> {
  const [attendanceSummary, evaluationData, courseEdition] = await Promise.all([
    getAttendanceSummary(courseEditionId),
    loadEditionEvaluationData(courseEditionId),
    findCourseEditionById(courseEditionId)
  ])
  if (!courseEdition) {
    throw new Error('Edición no encontrada')
  }

  const students: CourseEditionAcademicSummaryStudent[] = attendanceSummary.students.map(
    (student) => {
      const { processGrades, finalEvaluationGrade, finalEvaluation } = extractStudentGrades(
        evaluationData,
        student.studentId
      )

      const { academicStatus } = computeAcademicSummary({
        attendancePercentage: student.attendancePercentage,
        attendanceIrrecoverable: student.usedAbsences > student.allowedAbsences,
        minimumAttendancePercentage: courseEdition.minimumAttendancePercentage,
        courseEditionFinished: courseEdition.status === 'finished',
        processGrades,
        finalEvaluationGrade
      })

      return {
        studentId: student.studentId,
        fullName: student.fullName,
        attendanceCount: student.attendanceCount,
        attendancePercentage: student.attendancePercentage,
        attendance: student.attendance,
        finalEvaluation,
        academicStatus
      }
    }
  )

  return { totalClasses: attendanceSummary.totalClasses, students }
}
