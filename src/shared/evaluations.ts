import { z } from 'zod'

export const evaluationTypeSchema = z.enum(['process', 'final'])
export type EvaluationType = z.infer<typeof evaluationTypeSchema>

export const evaluationSchema = z.object({
  id: z.string(),
  courseEditionId: z.string(),
  type: evaluationTypeSchema,
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})
export type Evaluation = z.infer<typeof evaluationSchema>

export const studentEvaluationSchema = z.object({
  id: z.string(),
  evaluationId: z.string(),
  studentId: z.string(),
  passed: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
})
export type StudentEvaluation = z.infer<typeof studentEvaluationSchema>
