import type { StudentProvider } from './student-provider'
import {
  createStudent,
  deleteStudent,
  findStudentById,
  findStudentByDni,
  getStudents,
  updateStudent
} from '../db/student'

export const mongoStudentProvider: StudentProvider = {
  getAll: getStudents,
  findById: findStudentById,
  findByDni: findStudentByDni,
  create: createStudent,
  update: updateStudent,
  delete: deleteStudent
}
