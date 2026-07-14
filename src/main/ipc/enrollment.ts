import { z } from 'zod'
import { enrollmentSchema } from '../../shared/enrollments'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import {
  createEnrollment,
  deleteEnrollment,
  listEnrollmentsByCourseEdition
} from '../db/enrollment'
import { handleAuthenticated } from '../auth/require-session'

const idSchema = z.string()
const createEnrollmentInputSchema = enrollmentSchema.omit({ id: true, createdAt: true })

export function registerEnrollmentIpc(): void {
  handleAuthenticated(IPC_CHANNELS.ENROLLMENT_CREATE, (_event, data: unknown) => {
    return createEnrollment(createEnrollmentInputSchema.parse(data))
  })

  handleAuthenticated(
    IPC_CHANNELS.ENROLLMENT_LIST_BY_COURSE_EDITION,
    (_event, courseEditionId: unknown) => {
      return listEnrollmentsByCourseEdition(idSchema.parse(courseEditionId))
    }
  )

  handleAuthenticated(IPC_CHANNELS.ENROLLMENT_DELETE, (_event, id: unknown) => {
    return deleteEnrollment(idSchema.parse(id))
  })
}
