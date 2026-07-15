import type {
  StudentCertification,
  StudentCertificationEvaluation
} from '../../shared/electron-api'
import { getCourseDetail } from './teacher-course-service'
import { getAttendanceSummary } from './attendance-service'
import { getEvaluationResults, listEvaluations } from './evaluation-service'

export async function getStudentCertification(
  courseEditionId: string,
  studentId: string
): Promise<StudentCertification> {
  const detail = await getCourseDetail(courseEditionId)

  const student = detail.students.find((candidate) => candidate.id === studentId)
  if (!student) {
    throw new Error('El alumno no está inscripto en esta edición')
  }

  const [attendanceSummary, evaluations] = await Promise.all([
    getAttendanceSummary(courseEditionId),
    listEvaluations(courseEditionId)
  ])

  const attendancePercentage =
    attendanceSummary.students.find((candidate) => candidate.studentId === studentId)
      ?.attendancePercentage ?? 0
  const attendanceApproved = attendancePercentage >= 70

  const evaluationDetails: StudentCertificationEvaluation[] = await Promise.all(
    evaluations.map(async (evaluation) => {
      const results = await getEvaluationResults(evaluation.id)
      const result = results.students.find((candidate) => candidate.studentId === studentId)
      const status =
        result?.status === 'passed'
          ? 'approved'
          : result?.status === 'failed'
            ? 'failed'
            : 'pending'
      return { id: evaluation.id, name: evaluation.name, type: evaluation.type, status }
    })
  )

  const evaluationApproved =
    evaluationDetails.length > 0 &&
    evaluationDetails.every((evaluation) => evaluation.status === 'approved')

  return {
    student,
    attendancePercentage,
    attendanceApproved,
    evaluationApproved,
    eligibleForCertificate: attendanceApproved && evaluationApproved,
    evaluations: evaluationDetails
  }
}
