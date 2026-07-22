import { z } from 'zod'

export const evaluationTypeSchema = z.enum(['process', 'final'])
export type EvaluationType = z.infer<typeof evaluationTypeSchema>

export const evaluationSchema = z.object({
  id: z.string(),
  courseEditionId: z.string(),
  type: evaluationTypeSchema,
  name: z.string(),
  // Ruta relativa (dentro de userData/evaluation-pdfs) del PDF adjunto. El archivo en si nunca
  // se guarda en Mongo.
  pdfPath: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})
export type Evaluation = z.infer<typeof evaluationSchema>

export const evaluationGradeSchema = z.number().int().min(1).max(10)

export const studentEvaluationSchema = z.object({
  id: z.string(),
  evaluationId: z.string(),
  studentId: z.string(),
  grade: evaluationGradeSchema,
  createdAt: z.date(),
  updatedAt: z.date()
})
export type StudentEvaluation = z.infer<typeof studentEvaluationSchema>

export type EvaluationResultStatus = 'not-evaluated' | 'passed' | 'failed'

// Regla de negocio unica: una evaluacion aprueba con nota >= 7. El estado nunca se persiste,
// siempre se deriva de la nota.
export function evaluationStatusFromGrade(grade: number | null): EvaluationResultStatus {
  if (grade === null) return 'not-evaluated'
  return grade >= 7 ? 'passed' : 'failed'
}

export interface EvaluationResultEntry {
  studentId: string
  grade: number
}

export interface EvaluationResultStudent {
  studentId: string
  firstName: string
  lastName: string
  grade: number | null
  status: EvaluationResultStatus
}

export interface EvaluationResults {
  evaluation: Evaluation
  students: EvaluationResultStudent[]
}
