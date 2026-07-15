import { z } from 'zod'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { openProgram, removeProgram, uploadProgram } from '../services/course-program-service'
import { handleAuthenticated } from '../auth/require-session'
import { handleAdminOnly } from '../auth/require-admin'

const courseTemplateIdSchema = z.string()

export function registerCourseProgramIpc(): void {
  handleAdminOnly(IPC_CHANNELS.COURSE_PROGRAM_UPLOAD, (_event, courseTemplateId: unknown) => {
    return uploadProgram(courseTemplateIdSchema.parse(courseTemplateId))
  })

  handleAuthenticated(IPC_CHANNELS.COURSE_PROGRAM_OPEN, (_event, courseTemplateId: unknown) => {
    return openProgram(courseTemplateIdSchema.parse(courseTemplateId))
  })

  handleAdminOnly(IPC_CHANNELS.COURSE_PROGRAM_REMOVE, (_event, courseTemplateId: unknown) => {
    return removeProgram(courseTemplateIdSchema.parse(courseTemplateId))
  })
}
