import { z } from 'zod'
import { enrollmentSchema, enrollmentStatusSchema } from '../../shared/enrollments'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import {
  createEnrollment,
  deleteEnrollment,
  listEnrollmentsByCourseEdition,
  updateEnrollmentStatus
} from '../db/enrollment'
import { handleAuthenticated } from '../auth/require-session'
import { handleAdminOnly } from '../auth/require-admin'

const idSchema = z.string()
const createEnrollmentInputSchema = enrollmentSchema.omit({ id: true, createdAt: true })
const updateStatusInputSchema = z.object({
  id: z.string(),
  status: enrollmentStatusSchema
})

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

  handleAdminOnly(IPC_CHANNELS.ENROLLMENT_UPDATE_STATUS, (_event, data: unknown) => {
    const input = updateStatusInputSchema.parse(data)
    return updateEnrollmentStatus(input.id, input.status)
  })
}
