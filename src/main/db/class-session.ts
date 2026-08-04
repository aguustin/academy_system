import { Schema, model, type HydratedDocument } from 'mongoose'
import type { ClassSession } from '../../shared/class-sessions'

type ClassSessionDocument = Omit<ClassSession, 'id'>

const classSessionSchema = new Schema<ClassSessionDocument>(
  {
    courseEditionId: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    createdAt: { type: Date, required: true }
  },
  { collection: 'class_sessions' }
)

classSessionSchema.index({ courseEditionId: 1 })
classSessionSchema.index({ date: 1 })

const ClassSessionModel = model<ClassSessionDocument>('ClassSession', classSessionSchema)

function toClassSession(doc: HydratedDocument<ClassSessionDocument>): ClassSession {
  const { _id, courseEditionId, date, startTime, endTime, createdAt } = doc
  return { id: _id.toString(), courseEditionId, date, startTime, endTime, createdAt }
}

type CreateClassSessionInput = Omit<ClassSessionDocument, 'createdAt'>

export async function createClassSessions(
  sessions: CreateClassSessionInput[]
): Promise<ClassSession[]> {
  const now = new Date()
  const docs = await ClassSessionModel.create(
    sessions.map((session) => ({ ...session, createdAt: now }))
  )
  return docs.map(toClassSession)
}

export async function listClassSessionsByEdition(courseEditionId: string): Promise<ClassSession[]> {
  const docs = await ClassSessionModel.find({ courseEditionId }).sort({ date: 1 })
  return docs.map(toClassSession)
}

export async function findClassSessionById(id: string): Promise<ClassSession | null> {
  const doc = await ClassSessionModel.findById(id)
  return doc ? toClassSession(doc) : null
}

export async function deleteClassSession(id: string): Promise<void> {
  await ClassSessionModel.findByIdAndDelete(id)
}
