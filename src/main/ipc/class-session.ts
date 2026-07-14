import { z } from 'zod'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import {
  generateClassSessions,
  listClassSessionsByEdition
} from '../services/class-session-service'
import { handleAuthenticated } from '../auth/require-session'

const idSchema = z.string()

export function registerClassSessionIpc(): void {
  handleAuthenticated(IPC_CHANNELS.CLASS_SESSION_GENERATE, (_event, courseEditionId: unknown) => {
    return generateClassSessions(idSchema.parse(courseEditionId))
  })

  handleAuthenticated(
    IPC_CHANNELS.CLASS_SESSION_LIST_BY_EDITION,
    (_event, courseEditionId: unknown) => {
      return listClassSessionsByEdition(idSchema.parse(courseEditionId))
    }
  )
}
