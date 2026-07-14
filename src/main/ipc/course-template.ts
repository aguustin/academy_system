import { z } from 'zod'
import { courseTemplateSchema } from '../../shared/courses'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import {
  createCourseTemplate,
  deleteCourseTemplate,
  findCourseTemplateById,
  getCourseTemplates,
  updateCourseTemplate
} from '../db/course-template'
import { handleAuthenticated } from '../auth/require-session'

const idSchema = z.string()
const createCourseTemplateInputSchema = courseTemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})
const updateCourseTemplateInputSchema = createCourseTemplateInputSchema.partial()

export function registerCourseTemplateIpc(): void {
  handleAuthenticated(IPC_CHANNELS.COURSE_TEMPLATE_CREATE, (_event, data: unknown) => {
    return createCourseTemplate(createCourseTemplateInputSchema.parse(data))
  })

  handleAuthenticated(IPC_CHANNELS.COURSE_TEMPLATE_LIST, () => {
    return getCourseTemplates()
  })

  handleAuthenticated(IPC_CHANNELS.COURSE_TEMPLATE_GET_BY_ID, (_event, id: unknown) => {
    return findCourseTemplateById(idSchema.parse(id))
  })

  handleAuthenticated(IPC_CHANNELS.COURSE_TEMPLATE_UPDATE, (_event, id: unknown, data: unknown) => {
    return updateCourseTemplate(idSchema.parse(id), updateCourseTemplateInputSchema.parse(data))
  })

  handleAuthenticated(IPC_CHANNELS.COURSE_TEMPLATE_DELETE, (_event, id: unknown) => {
    return deleteCourseTemplate(idSchema.parse(id))
  })
}
