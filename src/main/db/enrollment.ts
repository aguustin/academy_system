import { Schema, model, type HydratedDocument } from 'mongoose'
import {
  enrollmentStatusSchema,
  type Enrollment,
  type EnrollmentStatus
} from '../../shared/enrollments'

type EnrollmentDocument = Omit<Enrollment, 'id'>

const enrollmentSchema = new Schema<EnrollmentDocument>(
  {
    studentId: { type: String, required: true },
    courseEditionId: { type: String, required: true },
    status: {
      type: String,
      enum: enrollmentStatusSchema.options,
      required: true,
      default: 'in-progress'
    },
    createdAt: { type: Date, required: true }
  },
  { collection: 'inscripciones' }
)

const EnrollmentModel = model<EnrollmentDocument>('Enrollment', enrollmentSchema)

function toEnrollment(doc: HydratedDocument<EnrollmentDocument>): Enrollment {
  const { _id, studentId, courseEditionId, status, createdAt } = doc
  // El default de Mongoose solo aplica a documentos nuevos: las inscripciones guardadas antes
  // de este campo no lo tienen almacenado y se leen como undefined, así que se respalda acá.
  return {
    id: _id.toString(),
    studentId,
    courseEditionId,
    status: status ?? 'in-progress',
    createdAt
  }
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

// Para resolver destinatarios de un aviso "a todos": todas las inscripciones del sistema.
export async function listAllEnrollments(): Promise<Enrollment[]> {
  const docs = await EnrollmentModel.find()
  return docs.map(toEnrollment)
}

export async function deleteEnrollment(id: string): Promise<void> {
  await EnrollmentModel.findByIdAndDelete(id)
}

export async function updateEnrollmentStatus(
  id: string,
  status: EnrollmentStatus
): Promise<Enrollment | null> {
  const doc = await EnrollmentModel.findByIdAndUpdate(id, { status }, { new: true })
  return doc ? toEnrollment(doc) : null
}

// Al finalizar una edición, las inscripciones que seguían "en cursado" pasan a "finalizó"
// (Abandono/No asistió no se tocan: ya quedaron resueltas antes de que la edición terminara).
export async function finishInProgressEnrollments(courseEditionId: string): Promise<void> {
  await EnrollmentModel.updateMany(
    { courseEditionId, status: 'in-progress' },
    { status: 'finished' }
  )
}
