import { z } from 'zod'
import { courseEditionInputSchema } from '../../shared/courses'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import {
  createCourseEdition,
  deleteCourseEdition,
  findCourseEditionById,
  getCourseEditions,
  updateCourseEdition
} from '../db/course-edition'
import { exportCourseEditionsAttendance } from '../services/course-edition-export-service'
import { handleAuthenticated } from '../auth/require-session'

const idSchema = z.string()
const courseEditionIdsSchema = z.array(z.string()).min(1)

export function registerCourseEditionIpc(): void {
  handleAuthenticated(IPC_CHANNELS.COURSE_EDITION_CREATE, (_event, data: unknown) => {
    return createCourseEdition(courseEditionInputSchema.parse(data))
  })

  handleAuthenticated(IPC_CHANNELS.COURSE_EDITION_LIST, () => {
    return getCourseEditions()
  })

  handleAuthenticated(IPC_CHANNELS.COURSE_EDITION_GET_BY_ID, (_event, id: unknown) => {
    return findCourseEditionById(idSchema.parse(id))
  })

  handleAuthenticated(IPC_CHANNELS.COURSE_EDITION_UPDATE, (_event, id: unknown, data: unknown) => {
    return updateCourseEdition(idSchema.parse(id), courseEditionInputSchema.parse(data))
  })

  handleAuthenticated(IPC_CHANNELS.COURSE_EDITION_DELETE, (_event, id: unknown) => {
    return deleteCourseEdition(idSchema.parse(id))
  })

  handleAuthenticated(IPC_CHANNELS.COURSE_EDITION_EXPORT_ATTENDANCE, (_event, ids: unknown) => {
    return exportCourseEditionsAttendance(courseEditionIdsSchema.parse(ids))
  })
}
