import { Schema, model, type HydratedDocument } from 'mongoose'
import {
  attendanceRegisteredBySchema,
  attendanceStatusSchema,
  type Attendance
} from '../../shared/attendance'

type AttendanceDocument = Omit<Attendance, 'id'>

const attendanceSchema = new Schema<AttendanceDocument>(
  {
    studentId: { type: String, required: true },
    courseEditionId: { type: String, required: true },
    classSessionId: { type: String, required: false },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: attendanceStatusSchema.options, required: true },
    registeredBy: { type: String, enum: attendanceRegisteredBySchema.options, required: true },
    createdAt: { type: Date, required: true }
  },
  { collection: 'asistencias' }
)

attendanceSchema.index({ classSessionId: 1 })

const AttendanceModel = model<AttendanceDocument>('Attendance', attendanceSchema)

function toAttendance(doc: HydratedDocument<AttendanceDocument>): Attendance {
  const {
    _id,
    studentId,
    courseEditionId,
    classSessionId,
    date,
    time,
    status,
    registeredBy,
    createdAt
  } = doc
  return {
    id: _id.toString(),
    studentId,
    courseEditionId,
    classSessionId,
    date,
    time,
    status,
    registeredBy,
    createdAt
  }
}

type CreateAttendanceInput = Omit<AttendanceDocument, 'createdAt'>

export async function createAttendance(data: CreateAttendanceInput): Promise<Attendance> {
  const doc = await AttendanceModel.create({ ...data, createdAt: new Date() })
  return toAttendance(doc)
}

export async function findAttendanceById(id: string): Promise<Attendance | null> {
  const doc = await AttendanceModel.findById(id)
  return doc ? toAttendance(doc) : null
}

export async function findAttendanceByCourseEdition(
  courseEditionId: string
): Promise<Attendance[]> {
  const docs = await AttendanceModel.find({ courseEditionId })
  return docs.map(toAttendance)
}

export async function findAttendanceByStudent(studentId: string): Promise<Attendance[]> {
  const docs = await AttendanceModel.find({ studentId })
  return docs.map(toAttendance)
}

export async function findAttendanceByCourseEditionAndDate(
  courseEditionId: string,
  date: Date
): Promise<Attendance[]> {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
  const docs = await AttendanceModel.find({
    courseEditionId,
    date: { $gte: startOfDay, $lt: endOfDay }
  })
  return docs.map(toAttendance)
}

export async function findAttendanceByClassSession(classSessionId: string): Promise<Attendance[]> {
  const docs = await AttendanceModel.find({ classSessionId })
  return docs.map(toAttendance)
}

export async function findAttendanceByClassSessionAndStudent(
  classSessionId: string,
  studentId: string
): Promise<Attendance | null> {
  const doc = await AttendanceModel.findOne({ classSessionId, studentId })
  return doc ? toAttendance(doc) : null
}

export async function updateAttendance(
  id: string,
  data: Partial<CreateAttendanceInput>
): Promise<Attendance | null> {
  const doc = await AttendanceModel.findByIdAndUpdate(id, data, { new: true })
  return doc ? toAttendance(doc) : null
}

export async function deleteAttendance(id: string): Promise<void> {
  await AttendanceModel.findByIdAndDelete(id)
}
