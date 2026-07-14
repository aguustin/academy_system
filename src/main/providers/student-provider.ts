import type { Student } from '../../shared/students'

export type StudentData = Omit<Student, 'id'>

export interface StudentProvider {
  getAll(): Promise<Student[]>
  findById(id: string): Promise<Student | null>
  findByDni(dni: string): Promise<Student | null>
  create(data: StudentData): Promise<Student>
  update(id: string, data: StudentData): Promise<Student | null>
  delete(id: string): Promise<void>
}
