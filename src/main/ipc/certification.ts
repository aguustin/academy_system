import { z } from 'zod'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { getStudentCertification } from '../services/certification-service'
import { handleAuthenticated } from '../auth/require-session'

const inputSchema = z.object({
  courseEditionId: z.string(),
  studentId: z.string()
})

export function registerCertificationIpc(): void {
  handleAuthenticated(
    IPC_CHANNELS.CERTIFICATION_GET_STUDENT_CERTIFICATION,
    (_event, data: unknown) => {
      const input = inputSchema.parse(data)
      return getStudentCertification(input.courseEditionId, input.studentId)
    }
  )
}
