import { z } from 'zod'
import { evaluationGradeSchema, evaluationTypeSchema } from '../../shared/evaluations'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import {
  createEvaluation,
  deleteEvaluation,
  getEvaluationResults,
  listEvaluations,
  saveEvaluationResults,
  updateEvaluation
} from '../services/evaluation-service'
import { handleAuthenticated } from '../auth/require-session'

const idSchema = z.string()
const createInputSchema = z.object({
  courseEditionId: z.string(),
  type: evaluationTypeSchema,
  name: z.string()
})
const updateInputSchema = z.object({
  type: evaluationTypeSchema,
  name: z.string()
})
const saveResultsInputSchema = z.object({
  evaluationId: z.string(),
  results: z.array(
    z.object({
      studentId: z.string(),
      grade: evaluationGradeSchema
    })
  )
})

export function registerEvaluationIpc(): void {
  handleAuthenticated(IPC_CHANNELS.EVALUATION_CREATE, (_event, data: unknown) => {
    return createEvaluation(createInputSchema.parse(data))
  })

  handleAuthenticated(IPC_CHANNELS.EVALUATION_UPDATE, (_event, id: unknown, data: unknown) => {
    return updateEvaluation(idSchema.parse(id), updateInputSchema.parse(data))
  })

  handleAuthenticated(IPC_CHANNELS.EVALUATION_DELETE, (_event, id: unknown) => {
    return deleteEvaluation(idSchema.parse(id))
  })

  handleAuthenticated(IPC_CHANNELS.EVALUATION_LIST, (_event, courseEditionId: unknown) => {
    return listEvaluations(idSchema.parse(courseEditionId))
  })

  handleAuthenticated(IPC_CHANNELS.EVALUATION_SAVE_RESULTS, (_event, data: unknown) => {
    const input = saveResultsInputSchema.parse(data)
    return saveEvaluationResults(input.evaluationId, input.results)
  })

  handleAuthenticated(IPC_CHANNELS.EVALUATION_GET_RESULTS, (_event, evaluationId: unknown) => {
    return getEvaluationResults(idSchema.parse(evaluationId))
  })
}
