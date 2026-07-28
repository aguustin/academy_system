import { MINIMUM_ATTENDANCE_PERCENTAGE } from '../../shared/attendance'
import type {
  StudentCertification,
  StudentCertificationEvaluation
} from '../../shared/electron-api'
import { getCourseDetail } from './teacher-course-service'
import { getAttendanceSummary } from './attendance-service'
import { getEvaluationResults, listEvaluations } from './evaluation-service'

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
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

  const [attendanceSummary, evaluations] = await Promise.all([
    getAttendanceSummary(courseEditionId),
    listEvaluations(courseEditionId)
  ])

  const studentAttendance = attendanceSummary.students.find(
    (candidate) => candidate.studentId === studentId
  )
  const attendancePercentage = studentAttendance?.attendancePercentage ?? 0
  const attendanceCount = studentAttendance?.attendanceCount ?? 0
  const attendanceApproved = attendancePercentage >= MINIMUM_ATTENDANCE_PERCENTAGE

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
      return {
        id: evaluation.id,
        name: evaluation.name,
        type: evaluation.type,
        grade: result?.grade ?? null,
        status
      }
    })
  )

  const grades = evaluationDetails
    .map((evaluation) => evaluation.grade)
    .filter((grade): grade is number => grade !== null)

  const averageGrade =
    grades.length === 0
      ? 0
      : round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length, 2)

  const approvedCount = evaluationDetails.filter(
    (evaluation) => evaluation.status === 'approved'
  ).length
  const approvedWorkPercentage =
    grades.length === 0 ? 0 : Math.round((approvedCount / grades.length) * 100)

  const workApproved = approvedWorkPercentage >= 70

  return {
    student,
    totalClasses: attendanceSummary.totalClasses,
    attendanceCount,
    attendancePercentage,
    attendanceApproved,
    averageGrade,
    approvedWorkPercentage,
    workApproved,
    eligibleForCertificate: attendanceApproved && workApproved,
    evaluations: evaluationDetails
  }
}
