import { Schema, model, type HydratedDocument } from 'mongoose'
import type { Student } from '../../shared/students'

type StudentDocument = Omit<Student, 'id'>

const studentSchema = new Schema<StudentDocument>(
  {
    dni: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true }
  },
  { collection: 'alumnos' }
)

const StudentModel = model<StudentDocument>('Student', studentSchema)

function toStudent(doc: HydratedDocument<StudentDocument>): Student {
  const { _id, dni, firstName, lastName } = doc
  return { id: _id.toString(), dni, firstName, lastName }
}

export async function createStudent(data: StudentDocument): Promise<Student> {
  const doc = await StudentModel.create(data)
  return toStudent(doc)
}

export async function getStudents(): Promise<Student[]> {
  const docs = await StudentModel.find().sort({ lastName: 1, firstName: 1 })
  return docs.map(toStudent)
}

export async function findStudentById(id: string): Promise<Student | null> {
  const doc = await StudentModel.findById(id)
  return doc ? toStudent(doc) : null
}

export async function findStudentByDni(dni: string): Promise<Student | null> {
  const doc = await StudentModel.findOne({ dni })
  return doc ? toStudent(doc) : null
}

export async function updateStudent(
  id: string,
  data: Partial<StudentDocument>
): Promise<Student | null> {
  const doc = await StudentModel.findByIdAndUpdate(id, data, { new: true })
  return doc ? toStudent(doc) : null
}

export async function deleteStudent(id: string): Promise<void> {
  await StudentModel.findByIdAndDelete(id)
}
