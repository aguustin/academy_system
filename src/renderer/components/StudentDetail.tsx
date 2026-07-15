import { useEffect, useState } from 'react'
import type { CertificationEvaluationStatus, StudentCertification } from '../../shared/electron-api'
import { Button } from './ui/button'

const EVALUATION_STATUS_LABELS: Record<CertificationEvaluationStatus, string> = {
  approved: 'Aprobada',
  failed: 'Desaprobada',
  pending: 'Pendiente'
}

interface StudentDetailProps {
  courseEditionId: string
  studentId: string
  onBack: () => void
}

export function StudentDetail({
  courseEditionId,
  studentId,
  onBack
}: StudentDetailProps): React.JSX.Element {
  const [certification, setCertification] = useState<StudentCertification | null>(null)

  useEffect(() => {
    window.api.certification
      .getStudentCertification(courseEditionId, studentId)
      .then(setCertification)
  }, [courseEditionId, studentId])

  if (certification === null) {
    return <p className="text-muted-foreground">Cargando...</p>
  }

  const { student, attendancePercentage, attendanceApproved, eligibleForCertificate, evaluations } =
    certification

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {student.firstName} {student.lastName}
        </h1>
        <Button variant="outline" size="sm" onClick={onBack}>
          Volver
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">DNI: {student.dni}</p>

      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Asistencia</h2>
        <p className="text-sm">{attendancePercentage}%</p>
        <p className="text-sm">
          {attendanceApproved ? '✅ Cumple asistencia' : '❌ No cumple asistencia'}
        </p>
      </div>

      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Evaluaciones</h2>
        {evaluations.length === 0 ? (
          <p className="text-muted-foreground">No hay evaluaciones cargadas para esta edición.</p>
        ) : (
          <ul className="space-y-1">
            {evaluations.map((evaluation) => (
              <li key={evaluation.id} className="text-sm">
                {evaluation.name}: {EVALUATION_STATUS_LABELS[evaluation.status]}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Estado final</h2>
        <p className="text-sm font-semibold">
          {eligibleForCertificate ? 'APTO PARA CERTIFICADO' : 'NO APTO'}
        </p>
      </div>
    </div>
  )
}
