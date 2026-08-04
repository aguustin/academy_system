import { z } from 'zod'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { searchGlobal } from '../services/search-service'
import { handleAdminOnly } from '../auth/require-admin'

const querySchema = z.string()

export function registerSearchIpc(): void {
  handleAdminOnly(IPC_CHANNELS.SEARCH_GLOBAL, (_event, query: unknown) => {
    return searchGlobal(querySchema.parse(query))
  })
}
