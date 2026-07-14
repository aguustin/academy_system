import { Schema, model, type HydratedDocument } from 'mongoose'
import type { Enrollment } from '../../shared/enrollments'

type EnrollmentDocument = Omit<Enrollment, 'id'>

const enrollmentSchema = new Schema<EnrollmentDocument>(
  {
    studentId: { type: String, required: true },
    courseEditionId: { type: String, required: true },
    createdAt: { type: Date, required: true }
  },
  { collection: 'inscripciones' }
)

const EnrollmentModel = model<EnrollmentDocument>('Enrollment', enrollmentSchema)

function toEnrollment(doc: HydratedDocument<EnrollmentDocument>): Enrollment {
  const { _id, studentId, courseEditionId, createdAt } = doc
  return { id: _id.toString(), studentId, courseEditionId, createdAt }
}

type CreateEnrollmentInput = Omit<EnrollmentDocument, 'createdAt'>

export async function createEnrollment(data: CreateEnrollmentInput): Promise<Enrollment> {
  const doc = await EnrollmentModel.create({ ...data, createdAt: new Date() })
  return toEnrollment(doc)
}

export async function listEnrollmentsByCourseEdition(
  courseEditionId: string
): Promise<Enrollment[]> {
  const docs = await EnrollmentModel.find({ courseEditionId })
  return docs.map(toEnrollment)
}

export async function listEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
  const docs = await EnrollmentModel.find({ studentId })
  return docs.map(toEnrollment)
}

export async function deleteEnrollment(id: string): Promise<void> {
  await EnrollmentModel.findByIdAndDelete(id)
}
