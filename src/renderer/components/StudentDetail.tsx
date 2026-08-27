import { useEffect, useState } from 'react'
import { evaluationGradeSchema } from '../../shared/evaluations'
import type { CertificationEvaluationStatus, StudentCertification } from '../../shared/electron-api'
import type { AcademicStatus, EvaluationType } from '../../shared/evaluations'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { Input } from './ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { useAlertDialog } from './ui/confirm-dialog'
import { parseGradeInput, sortByField } from '../lib/utils'

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

const EVALUATION_TYPE_LABELS: Record<EvaluationType, string> = {
  process: 'Proceso',
  final: 'Final'
}

const ACADEMIC_STATUS_LABELS: Record<AcademicStatus, string> = {
  approved: 'APROBADO',
  failed: 'DESAPROBADO',
  'in-progress': 'EN CURSADO'
}

const ACADEMIC_STATUS_VARIANT: Record<AcademicStatus, 'success' | 'destructive' | 'secondary'> = {
  approved: 'success',
  failed: 'destructive',
  'in-progress': 'secondary'
}

function gradeFieldError(rawValue: string): string | null {
  if (rawValue.trim() === '') return null
  const parsed = parseGradeInput(rawValue)
  return evaluationGradeSchema.safeParse(parsed).success
    ? null
    : 'La nota debe ser un número entre 0 y 10'
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
  const alertDialog = useAlertDialog()
  const [certification, setCertification] = useState<StudentCertification | null>(null)
  const [gradeInputs, setGradeInputs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  function loadCertification(): void {
    window.api.certification.getStudentCertification(courseEditionId, studentId).then((data) => {
      setCertification(data)
      setGradeInputs(
        Object.fromEntries(
          data.evaluations.map((evaluation) => [evaluation.id, evaluation.grade?.toString() ?? ''])
        )
      )
    })
  }

  useEffect(loadCertification, [courseEditionId, studentId])

  if (certification === null) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>
  }

  const {
    student,
    totalClasses,
    attendanceCount,
    attendancePercentage,
    attendanceApproved,
    processAverageGrade,
    finalEvaluation,
    academicStatus,
    evaluations
  } = certification

  function setGradeInput(evaluationId: string, rawValue: string): void {
    setSavedMessage(null)
    setGradeInputs((current) => ({ ...current, [evaluationId]: rawValue }))
  }

  async function handleSave(): Promise<void> {
    const hasInvalidGrade = evaluations.some(
      (evaluation) => gradeFieldError(gradeInputs[evaluation.id] ?? '') !== null
    )
    if (hasInvalidGrade) {
      await alertDialog('Corregí las notas inválidas antes de guardar.')
      return
    }

    setSaving(true)
    try {
      for (const evaluation of evaluations) {
        const rawValue = gradeInputs[evaluation.id] ?? ''
        if (rawValue.trim() === '') continue
        await window.api.evaluation.saveResults(evaluation.id, [
          { studentId, grade: parseGradeInput(rawValue) }
        ])
      }
      setSavedMessage('Notas guardadas correctamente.')
      loadCertification()
    } catch (err) {
      await alertDialog(err instanceof Error ? err.message : 'No se pudieron guardar las notas.')
    } finally {
      setSaving(false)
    }
  }

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
        <p className="text-sm text-muted-foreground">Clases del curso: {totalClasses}</p>
        <p className="text-sm text-muted-foreground">Asistencias registradas: {attendanceCount}</p>
      </Card>

      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Calificaciones</h2>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            Guardar cambios
          </Button>
        </div>

        {savedMessage && <p className="text-sm text-success">{savedMessage}</p>}

        {evaluations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay evaluaciones cargadas para esta edición.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evaluación</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortByField(evaluations, (evaluation) => evaluation.name).map((evaluation) => {
                const rawValue = gradeInputs[evaluation.id] ?? ''
                const error = gradeFieldError(rawValue)
                return (
                  <TableRow key={evaluation.id}>
                    <TableCell className="font-medium">{evaluation.name}</TableCell>
                    <TableCell>
                      <Badge variant={evaluation.type === 'final' ? 'default' : 'secondary'}>
                        {EVALUATION_TYPE_LABELS[evaluation.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0-10"
                        value={rawValue}
                        onChange={(event) => setGradeInput(evaluation.id, event.target.value)}
                        className="w-20"
                      />
                      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={EVALUATION_STATUS_VARIANT[evaluation.status]}>
                        {EVALUATION_STATUS_LABELS[evaluation.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}

        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Promedio de proceso</p>
            <p className="text-lg font-semibold text-foreground">{processAverageGrade ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Evaluación final</p>
            <p className="text-lg font-semibold text-foreground">
              {finalEvaluation === null ? 'No creada' : (finalEvaluation.grade ?? 'Pendiente')}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Asistencia</p>
            <p className="text-lg font-semibold text-foreground">{attendancePercentage}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estado</p>
            <Badge variant={ACADEMIC_STATUS_VARIANT[academicStatus]}>
              {ACADEMIC_STATUS_LABELS[academicStatus]}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}
