import { useEffect, useState } from 'react'
import type { CertificationEvaluationStatus, StudentCertification } from '../../shared/electron-api'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

const EVALUATION_STATUS_LABELS: Record<CertificationEvaluationStatus, string> = {
  approved: 'Aprobada',
  failed: 'Desaprobada',
  pending: 'Pendiente'
}

const EVALUATION_STATUS_VARIANT: Record<
  CertificationEvaluationStatus,
  'success' | 'destructive' | 'secondary'
> = {
  approved: 'success',
  failed: 'destructive',
  pending: 'secondary'
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
    return <p className="text-sm text-muted-foreground">Cargando...</p>
  }

  const {
    student,
    attendancePercentage,
    attendanceApproved,
    averageGrade,
    approvedWorkPercentage,
    eligibleForCertificate,
    evaluations
  } = certification

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {student.firstName} {student.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">DNI: {student.dni}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack}>
          Volver
        </Button>
      </div>

      <Card className="space-y-2 p-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Asistencia</h2>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-semibold text-foreground">{attendancePercentage}%</span>
          <Badge variant={attendanceApproved ? 'success' : 'destructive'}>
            {attendanceApproved ? 'Cumple asistencia' : 'No cumple asistencia'}
          </Badge>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Calificaciones</h2>
        {evaluations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay evaluaciones cargadas para esta edición.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evaluación</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluations.map((evaluation) => (
                <TableRow key={evaluation.id}>
                  <TableCell className="font-medium">{evaluation.name}</TableCell>
                  <TableCell>{evaluation.grade ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={EVALUATION_STATUS_VARIANT[evaluation.status]}>
                      {EVALUATION_STATUS_LABELS[evaluation.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Promedio de notas</p>
            <p className="text-lg font-semibold text-foreground">{averageGrade}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Trabajos aprobados</p>
            <p className="text-lg font-semibold text-foreground">{approvedWorkPercentage}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Asistencia</p>
            <p className="text-lg font-semibold text-foreground">{attendancePercentage}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Resultado final</p>
            <p
              className={`text-lg font-semibold ${eligibleForCertificate ? 'text-success' : 'text-destructive'}`}
            >
              {eligibleForCertificate ? 'APTO' : 'NO APTO'}
            </p>
          </div>
        </div>
      </Card>

      <Card
        className={`p-6 ${eligibleForCertificate ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}
      >
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Estado final</h2>
        <p
          className={`mt-1 text-lg font-semibold ${eligibleForCertificate ? 'text-success' : 'text-destructive'}`}
        >
          {eligibleForCertificate ? 'APTO PARA CERTIFICADO' : 'NO APTO'}
        </p>
      </Card>
    </div>
  )
}
