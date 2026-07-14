import { Schema, model, type HydratedDocument } from 'mongoose'
import {
  courseEditionStatusSchema,
  dayOfWeekSchema,
  type CourseEdition,
  type Schedule
} from '../../shared/courses'

type CourseEditionDocument = Omit<CourseEdition, 'id'>

const scheduleSchema = new Schema<Schedule>(
  {
    dayOfWeek: { type: String, enum: dayOfWeekSchema.options, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  },
  { _id: false }
)

const courseEditionSchema = new Schema<CourseEditionDocument>(
  {
    templateId: { type: String, required: true },
    teacherId: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    schedules: { type: [scheduleSchema], required: true },
    status: { type: String, enum: courseEditionStatusSchema.options, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
  },
  { collection: 'cursadas' }
)

const CourseEditionModel = model<CourseEditionDocument>('CourseEdition', courseEditionSchema)

function toCourseEdition(doc: HydratedDocument<CourseEditionDocument>): CourseEdition {
  const {
    _id,
    templateId,
    teacherId,
    startDate,
    endDate,
    schedules,
    status,
    createdAt,
    updatedAt
  } = doc
  return {
    id: _id.toString(),
    templateId,
    teacherId,
    startDate,
    endDate,
    schedules: schedules.map((schedule) => ({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime
    })),
    status,
    createdAt,
    updatedAt
  }
}

type CreateCourseEditionInput = Omit<CourseEditionDocument, 'createdAt' | 'updatedAt'>

export async function createCourseEdition(data: CreateCourseEditionInput): Promise<CourseEdition> {
  const now = new Date()
  const doc = await CourseEditionModel.create({ ...data, createdAt: now, updatedAt: now })
  return toCourseEdition(doc)
}

export async function findCourseEditionById(id: string): Promise<CourseEdition | null> {
  const doc = await CourseEditionModel.findById(id)
  return doc ? toCourseEdition(doc) : null
}

export async function getCourseEditions(): Promise<CourseEdition[]> {
  const docs = await CourseEditionModel.find().sort({ startDate: 1 })
  return docs.map(toCourseEdition)
}

export async function updateCourseEdition(
  id: string,
  data: Partial<CreateCourseEditionInput>
): Promise<CourseEdition | null> {
  const doc = await CourseEditionModel.findByIdAndUpdate(
    id,
    { ...data, updatedAt: new Date() },
    { new: true }
  )
  return doc ? toCourseEdition(doc) : null
}

export async function deleteCourseEdition(id: string): Promise<void> {
  await CourseEditionModel.findByIdAndDelete(id)
}
