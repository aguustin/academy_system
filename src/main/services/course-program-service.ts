import type { CourseTemplate } from '../../shared/courses'
import { findCourseTemplateById, updateCourseTemplate } from '../db/course-template'
import { openStoredFile, pickAndStoreFile, removeStoredFile } from './file-storage'

const PROGRAMS_FOLDER = 'programs'

async function requireCourseTemplate(courseTemplateId: string): Promise<CourseTemplate> {
  const courseTemplate = await findCourseTemplateById(courseTemplateId)
  if (!courseTemplate) {
    throw new Error('Curso no encontrado')
  }
  return courseTemplate
}

export async function uploadProgram(courseTemplateId: string): Promise<CourseTemplate> {
  const courseTemplate = await requireCourseTemplate(courseTemplateId)

  const fileName = await pickAndStoreFile(
    PROGRAMS_FOLDER,
    ['pdf', 'doc', 'docx'],
    'Programa del curso'
  )
  if (!fileName) {
    return courseTemplate
  }

  if (courseTemplate.programFile) {
    await removeStoredFile(PROGRAMS_FOLDER, courseTemplate.programFile)
  }

  const updated = await updateCourseTemplate(courseTemplateId, { programFile: fileName })
  if (!updated) {
    throw new Error('Curso no encontrado')
  }
  return updated
}

export async function openProgram(courseTemplateId: string): Promise<void> {
  const courseTemplate = await findCourseTemplateById(courseTemplateId)
  if (!courseTemplate?.programFile) {
    throw new Error('Este curso no tiene un programa adjunto')
  }

  await openStoredFile(PROGRAMS_FOLDER, courseTemplate.programFile)
}

export async function removeProgram(courseTemplateId: string): Promise<CourseTemplate> {
  const courseTemplate = await requireCourseTemplate(courseTemplateId)

  if (courseTemplate.programFile) {
    await removeStoredFile(PROGRAMS_FOLDER, courseTemplate.programFile)
  }

  const updated = await updateCourseTemplate(courseTemplateId, { programFile: null })
  if (!updated) {
    throw new Error('Curso no encontrado')
  }
  return updated
}
