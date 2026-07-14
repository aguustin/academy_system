import { Schema, model, type HydratedDocument } from 'mongoose'
import type { CourseTemplate } from '../../shared/courses'

type CourseTemplateDocument = Omit<CourseTemplate, 'id'>

const courseTemplateSchema = new Schema<CourseTemplateDocument>(
  {
    name: { type: String, required: true },
    description: { type: String, required: false },
    active: { type: Boolean, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
  },
  { collection: 'cursos' }
)

const CourseTemplateModel = model<CourseTemplateDocument>('CourseTemplate', courseTemplateSchema)

function toCourseTemplate(doc: HydratedDocument<CourseTemplateDocument>): CourseTemplate {
  const { _id, name, description, active, createdAt, updatedAt } = doc
  return { id: _id.toString(), name, description, active, createdAt, updatedAt }
}

type CreateCourseTemplateInput = Omit<CourseTemplateDocument, 'createdAt' | 'updatedAt'>

export async function createCourseTemplate(
  data: CreateCourseTemplateInput
): Promise<CourseTemplate> {
  const now = new Date()
  const doc = await CourseTemplateModel.create({ ...data, createdAt: now, updatedAt: now })
  return toCourseTemplate(doc)
}

export async function findCourseTemplateById(id: string): Promise<CourseTemplate | null> {
  const doc = await CourseTemplateModel.findById(id)
  return doc ? toCourseTemplate(doc) : null
}

export async function getCourseTemplates(): Promise<CourseTemplate[]> {
  const docs = await CourseTemplateModel.find().sort({ name: 1 })
  return docs.map(toCourseTemplate)
}

export async function updateCourseTemplate(
  id: string,
  data: Partial<CreateCourseTemplateInput>
): Promise<CourseTemplate | null> {
  const doc = await CourseTemplateModel.findByIdAndUpdate(
    id,
    { ...data, updatedAt: new Date() },
    { new: true }
  )
  return doc ? toCourseTemplate(doc) : null
}

export async function deleteCourseTemplate(id: string): Promise<void> {
  await CourseTemplateModel.findByIdAndDelete(id)
}
