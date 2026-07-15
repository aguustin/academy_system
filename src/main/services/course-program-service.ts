import { existsSync } from 'node:fs'
import { copyFile, mkdir, unlink } from 'node:fs/promises'
import path from 'node:path'
import { app, dialog, shell } from 'electron'
import type { CourseTemplate } from '../../shared/courses'
import { findCourseTemplateById, updateCourseTemplate } from '../db/course-template'

function getProgramsDir(): string {
  return path.join(app.getPath('userData'), 'programs')
}

async function removeProgramFile(fileName: string): Promise<void> {
  const filePath = path.join(getProgramsDir(), fileName)
  if (existsSync(filePath)) {
    await unlink(filePath)
  }
}

async function requireCourseTemplate(courseTemplateId: string): Promise<CourseTemplate> {
  const courseTemplate = await findCourseTemplateById(courseTemplateId)
  if (!courseTemplate) {
    throw new Error('Curso no encontrado')
  }
  return courseTemplate
}

export async function uploadProgram(courseTemplateId: string): Promise<CourseTemplate> {
  const courseTemplate = await requireCourseTemplate(courseTemplateId)

  const dialogResult = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Programa del curso', extensions: ['pdf', 'doc', 'docx'] }]
  })
  if (dialogResult.canceled || dialogResult.filePaths.length === 0) {
    return courseTemplate
  }

  const programsDir = getProgramsDir()
  await mkdir(programsDir, { recursive: true })

  const sourcePath = dialogResult.filePaths[0]
  const fileName = `${Date.now()}-${path.basename(sourcePath)}`
  await copyFile(sourcePath, path.join(programsDir, fileName))

  if (courseTemplate.programFile) {
    await removeProgramFile(courseTemplate.programFile)
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

  const filePath = path.join(getProgramsDir(), courseTemplate.programFile)
  const errorMessage = await shell.openPath(filePath)
  if (errorMessage) {
    throw new Error(errorMessage)
  }
}

export async function removeProgram(courseTemplateId: string): Promise<CourseTemplate> {
  const courseTemplate = await requireCourseTemplate(courseTemplateId)

  if (courseTemplate.programFile) {
    await removeProgramFile(courseTemplate.programFile)
  }

  const updated = await updateCourseTemplate(courseTemplateId, { programFile: null })
  if (!updated) {
    throw new Error('Curso no encontrado')
  }
  return updated
}
