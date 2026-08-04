import type { Teacher } from './teachers'
import type { CourseTemplate, CourseEdition, CourseEditionInput } from './courses'
import type { Student } from './students'
import type { Enrollment } from './enrollments'
import type {
  Attendance,
  AttendanceSummary,
  ClassAttendanceEntry,
  ClassAttendanceStudent,
  FindStudentTodayClassesResult,
  RegisterClassAttendanceResult
} from './attendance'
import type { AuthUser, LoginResult } from './auth'
import type { User, UserRole } from './users'
import type { ClassSession, GenerateClassSessionsResult } from './class-sessions'
import type {
  Evaluation,
  EvaluationResultEntry,
  EvaluationResults,
  EvaluationType
} from './evaluations'

export type TeacherInput = Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>
export type CourseTemplateInput = Omit<
  CourseTemplate,
  'id' | 'createdAt' | 'updatedAt' | 'programFile'
>
export type EnrollmentInput = Omit<Enrollment, 'id' | 'createdAt'>
export type StudentInput = Omit<Student, 'id'>
export interface ImportStudentsResult {
  imported: number
  duplicates: number
  invalid: number
}
// UserListItem/UserCreateInput/UserUpdateInput combinan User con los datos del Teacher
// vinculado (Ticket 027): la administración de talleristas se unificó en un único formulario,
// por lo que estos tipos ya no son un simple Omit<User, ...> sino una composición de ambas
// entidades. Los campos de Teacher son null/opcionales para administradores (no tienen Teacher).
export interface UserListItem extends Omit<User, 'password'> {
  firstName: string | null
  lastName: string | null
  dni: string | null
  phone: string | null
}
export interface UserCreateInput {
  username: string
  email: string
  password: string
  role: UserRole
  active: boolean
  firstName?: string
  lastName?: string
  dni?: string
  phone?: string
}
export interface UserUpdateInput {
  username: string
  email: string
  role: UserRole
  active: boolean
  firstName?: string
  lastName?: string
  dni?: string
  phone?: string
}
export type EvaluationCreateInput = Omit<Evaluation, 'id' | 'createdAt' | 'updatedAt' | 'pdfPath'>
export type EvaluationUpdateInput = Omit<
  Evaluation,
  'id' | 'courseEditionId' | 'createdAt' | 'updatedAt' | 'pdfPath'
>
export interface TeacherCourseSummary {
  courseEdition: CourseEdition
  courseTemplate: CourseTemplate | null
  studentCount: number
  classSessionCount: number
}
export interface TeacherCourseDetail {
  courseEdition: CourseEdition
  courseTemplate: CourseTemplate | null
  teacher: Teacher | null
  students: Student[]
  classSessions: ClassSession[]
}
export type CertificationEvaluationStatus = 'approved' | 'failed' | 'pending'
export interface StudentCertificationEvaluation {
  id: string
  name: string
  type: EvaluationType
  grade: number | null
  status: CertificationEvaluationStatus
}
export interface StudentCertification {
  student: Student
  totalClasses: number
  attendanceCount: number
  attendancePercentage: number
  attendanceApproved: boolean
  averageGrade: number
  approvedWorkPercentage: number
  workApproved: boolean
  eligibleForCertificate: boolean
  evaluations: StudentCertificationEvaluation[]
}

export interface ElectronApi {
  system: {
    getVersion: () => Promise<string>
  }
  auth: {
    login: (username: string, password: string) => Promise<LoginResult>
    logout: () => Promise<void>
    getSession: () => Promise<AuthUser | null>
    changePassword: (newPassword: string) => Promise<AuthUser>
  }
  user: {
    list: () => Promise<UserListItem[]>
    create: (data: UserCreateInput) => Promise<UserListItem>
    update: (id: string, data: UserUpdateInput) => Promise<UserListItem | null>
    delete: (id: string) => Promise<void>
    resetPassword: (id: string) => Promise<void>
  }
  teacher: {
    create: (data: TeacherInput) => Promise<Teacher>
    list: () => Promise<Teacher[]>
    getById: (id: string) => Promise<Teacher | null>
    update: (id: string, data: Partial<TeacherInput>) => Promise<Teacher | null>
    delete: (id: string) => Promise<void>
  }
  courseTemplate: {
    create: (data: CourseTemplateInput) => Promise<CourseTemplate>
    list: () => Promise<CourseTemplate[]>
    getById: (id: string) => Promise<CourseTemplate | null>
    update: (id: string, data: Partial<CourseTemplateInput>) => Promise<CourseTemplate | null>
    delete: (id: string) => Promise<void>
  }
  courseEdition: {
    create: (data: CourseEditionInput) => Promise<CourseEdition>
    list: () => Promise<CourseEdition[]>
    getById: (id: string) => Promise<CourseEdition | null>
    update: (id: string, data: CourseEditionInput) => Promise<CourseEdition | null>
    delete: (id: string) => Promise<void>
    exportAttendance: (courseEditionIds: string[]) => Promise<string | null>
  }
  student: {
    list: () => Promise<Student[]>
    getById: (id: string) => Promise<Student | null>
    findByDni: (dni: string) => Promise<Student | null>
    create: (data: StudentInput) => Promise<Student>
    update: (id: string, data: StudentInput) => Promise<Student | null>
    delete: (id: string) => Promise<void>
    importFromExcel: () => Promise<ImportStudentsResult | null>
  }
  enrollment: {
    create: (data: EnrollmentInput) => Promise<Enrollment>
    listByCourseEdition: (courseEditionId: string) => Promise<Enrollment[]>
    delete: (id: string) => Promise<void>
  }
  attendance: {
    findTodayClasses: (dni: string) => Promise<FindStudentTodayClassesResult>
    registerClass: (
      classSessionId: string,
      studentId: string
    ) => Promise<RegisterClassAttendanceResult>
    findByCourseEdition: (courseEditionId: string) => Promise<Attendance[]>
    findByStudent: (studentId: string) => Promise<Attendance[]>
    list: (courseEditionId: string, date: Date) => Promise<Attendance[]>
    saveClassAttendance: (
      classSessionId: string,
      entries: ClassAttendanceEntry[]
    ) => Promise<ClassAttendanceStudent[]>
    listByClass: (classSessionId: string) => Promise<ClassAttendanceStudent[]>
    getSummary: (courseEditionId: string) => Promise<AttendanceSummary>
  }
  classSession: {
    generate: (courseEditionId: string) => Promise<GenerateClassSessionsResult>
    listByEdition: (courseEditionId: string) => Promise<ClassSession[]>
  }
  teacherCourse: {
    listMyCourses: () => Promise<TeacherCourseSummary[]>
    getDetail: (courseEditionId: string) => Promise<TeacherCourseDetail>
  }
  evaluation: {
    create: (data: EvaluationCreateInput) => Promise<Evaluation>
    update: (id: string, data: EvaluationUpdateInput) => Promise<Evaluation | null>
    delete: (id: string) => Promise<void>
    list: (courseEditionId: string) => Promise<Evaluation[]>
    saveResults: (
      evaluationId: string,
      results: EvaluationResultEntry[]
    ) => Promise<EvaluationResults>
    getResults: (evaluationId: string) => Promise<EvaluationResults>
    uploadPdf: (evaluationId: string) => Promise<Evaluation>
    openPdf: (evaluationId: string) => Promise<void>
    removePdf: (evaluationId: string) => Promise<Evaluation>
  }
  certification: {
    getStudentCertification: (
      courseEditionId: string,
      studentId: string
    ) => Promise<StudentCertification>
  }
  courseProgram: {
    upload: (courseTemplateId: string) => Promise<CourseTemplate>
    open: (courseTemplateId: string) => Promise<void>
    remove: (courseTemplateId: string) => Promise<CourseTemplate>
  }
}
