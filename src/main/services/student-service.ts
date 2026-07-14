import type { Student } from '../../shared/students'
import type { StudentInput } from '../../shared/electron-api'
import { mongoStudentProvider } from '../providers/mongo-student-provider'

export async function createStudent(data: StudentInput): Promise<Student> {
  const existing = await mongoStudentProvider.findByDni(data.dni)
  if (existing) {
    throw new Error(`Ya existe un alumno con el DNI ${data.dni}`)
  }
  return mongoStudentProvider.create(data)
}

export async function updateStudent(id: string, data: StudentInput): Promise<Student | null> {
  const existing = await mongoStudentProvider.findByDni(data.dni)
  if (existing && existing.id !== id) {
    throw new Error(`Ya existe un alumno con el DNI ${data.dni}`)
  }
  return mongoStudentProvider.update(id, data)
}

export async function deleteStudent(id: string): Promise<void> {
  await mongoStudentProvider.delete(id)
}
