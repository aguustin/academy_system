import { app } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { handleAuthenticated } from '../auth/require-session'

export function registerSystemIpc(): void {
  handleAuthenticated(IPC_CHANNELS.SYSTEM_GET_VERSION, () => app.getVersion())
}
