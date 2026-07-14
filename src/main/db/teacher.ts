import { Schema, model, type HydratedDocument } from 'mongoose'
import type { Teacher } from '../../shared/teachers'

type TeacherDocument = Omit<Teacher, 'id'>

const teacherSchema = new Schema<TeacherDocument>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dni: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    active: { type: Boolean, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
  },
  { collection: 'docentes' }
)

const TeacherModel = model<TeacherDocument>('Teacher', teacherSchema)

function toTeacher(doc: HydratedDocument<TeacherDocument>): Teacher {
  const { _id, firstName, lastName, dni, email, phone, active, createdAt, updatedAt } = doc
  return {
    id: _id.toString(),
    firstName,
    lastName,
    dni,
    email,
    phone,
    active,
    createdAt,
    updatedAt
  }
}

type CreateTeacherInput = Omit<TeacherDocument, 'createdAt' | 'updatedAt'>

export async function createTeacher(data: CreateTeacherInput): Promise<Teacher> {
  const now = new Date()
  const doc = await TeacherModel.create({ ...data, createdAt: now, updatedAt: now })
  return toTeacher(doc)
}

export async function findTeacherById(id: string): Promise<Teacher | null> {
  const doc = await TeacherModel.findById(id)
  return doc ? toTeacher(doc) : null
}

export async function getTeachers(): Promise<Teacher[]> {
  const docs = await TeacherModel.find().sort({ lastName: 1, firstName: 1 })
  return docs.map(toTeacher)
}

export async function updateTeacher(
  id: string,
  data: Partial<CreateTeacherInput>
): Promise<Teacher | null> {
  const doc = await TeacherModel.findByIdAndUpdate(
    id,
    { ...data, updatedAt: new Date() },
    { new: true }
  )
  return doc ? toTeacher(doc) : null
}

export async function deleteTeacher(id: string): Promise<void> {
  await TeacherModel.findByIdAndDelete(id)
}
