import { Schema, model, type HydratedDocument } from 'mongoose'
import {
  evaluationTypeSchema,
  type Evaluation,
  type StudentEvaluation
} from '../../shared/evaluations'

type EvaluationDocument = Omit<Evaluation, 'id'>

const evaluationSchema = new Schema<EvaluationDocument>(
  {
    courseEditionId: { type: String, required: true },
    type: { type: String, enum: evaluationTypeSchema.options, required: true },
    name: { type: String, required: true },
    pdfPath: { type: String, required: false },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
  },
  { collection: 'evaluations' }
)

evaluationSchema.index({ courseEditionId: 1 })

const EvaluationModel = model<EvaluationDocument>('Evaluation', evaluationSchema)

function toEvaluation(doc: HydratedDocument<EvaluationDocument>): Evaluation {
  const { _id, courseEditionId, type, name, pdfPath, createdAt, updatedAt } = doc
  return { id: _id.toString(), courseEditionId, type, name, pdfPath, createdAt, updatedAt }
}

type CreateEvaluationInput = Omit<EvaluationDocument, 'createdAt' | 'updatedAt'>

export async function createEvaluation(data: CreateEvaluationInput): Promise<Evaluation> {
  const now = new Date()
  const doc = await EvaluationModel.create({ ...data, createdAt: now, updatedAt: now })
  return toEvaluation(doc)
}

export async function findEvaluationById(id: string): Promise<Evaluation | null> {
  const doc = await EvaluationModel.findById(id)
  return doc ? toEvaluation(doc) : null
}

export async function listEvaluationsByEdition(courseEditionId: string): Promise<Evaluation[]> {
  const docs = await EvaluationModel.find({ courseEditionId }).sort({ name: 1 })
  return docs.map(toEvaluation)
}

type UpdateEvaluationInput = Partial<Omit<CreateEvaluationInput, 'pdfPath'>> & {
  pdfPath?: string | null
}

export async function updateEvaluation(
  id: string,
  data: UpdateEvaluationInput
): Promise<Evaluation | null> {
  const { pdfPath, ...rest } = data
  const update: Partial<EvaluationDocument> & { $unset?: { pdfPath: '' } } = {
    ...rest,
    updatedAt: new Date()
  }
  if (pdfPath === null) {
    update.$unset = { pdfPath: '' }
  } else if (pdfPath !== undefined) {
    update.pdfPath = pdfPath
  }

  const doc = await EvaluationModel.findByIdAndUpdate(id, update, { new: true })
  return doc ? toEvaluation(doc) : null
}

export async function deleteEvaluation(id: string): Promise<void> {
  await EvaluationModel.findByIdAndDelete(id)
}

type StudentEvaluationDocument = Omit<StudentEvaluation, 'id'>

const studentEvaluationSchema = new Schema<StudentEvaluationDocument>(
  {
    evaluationId: { type: String, required: true },
    studentId: { type: String, required: true },
    grade: { type: Number, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
  },
  { collection: 'student_evaluations' }
)

studentEvaluationSchema.index({ evaluationId: 1 })

const StudentEvaluationModel = model<StudentEvaluationDocument>(
  'StudentEvaluation',
  studentEvaluationSchema
)

function toStudentEvaluation(doc: HydratedDocument<StudentEvaluationDocument>): StudentEvaluation {
  const { _id, evaluationId, studentId, grade, createdAt, updatedAt } = doc
  return { id: _id.toString(), evaluationId, studentId, grade, createdAt, updatedAt }
}

export async function findStudentEvaluation(
  evaluationId: string,
  studentId: string
): Promise<StudentEvaluation | null> {
  const doc = await StudentEvaluationModel.findOne({ evaluationId, studentId })
  return doc ? toStudentEvaluation(doc) : null
}

export async function listStudentEvaluations(evaluationId: string): Promise<StudentEvaluation[]> {
  const docs = await StudentEvaluationModel.find({ evaluationId })
  return docs.map(toStudentEvaluation)
}

// Trae las notas de varias evaluaciones a la vez (todos los alumnos): lo usa certification-service
// para calcular la situación académica de toda una edición sin una consulta por evaluación.
export async function listStudentEvaluationsByEvaluationIds(
  evaluationIds: string[]
): Promise<StudentEvaluation[]> {
  if (evaluationIds.length === 0) return []
  const docs = await StudentEvaluationModel.find({ evaluationId: { $in: evaluationIds } })
  return docs.map(toStudentEvaluation)
}

export interface SaveStudentEvaluationInput {
  evaluationId: string
  studentId: string
  grade: number
}

export async function saveStudentEvaluations(entries: SaveStudentEvaluationInput[]): Promise<void> {
  const now = new Date()
  for (const entry of entries) {
    const existing = await findStudentEvaluation(entry.evaluationId, entry.studentId)
    if (existing) {
      await StudentEvaluationModel.findByIdAndUpdate(existing.id, {
        grade: entry.grade,
        updatedAt: now
      })
    } else {
      await StudentEvaluationModel.create({
        evaluationId: entry.evaluationId,
        studentId: entry.studentId,
        grade: entry.grade,
        createdAt: now,
        updatedAt: now
      })
    }
  }
}
