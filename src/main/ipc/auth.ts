import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { changePassword, getCurrentUser, login, logout } from '../services/auth-service'
import { handleAuthenticated } from '../auth/require-session'

const loginInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
})
const changePasswordInputSchema = z.string().min(6)

export function registerAuthIpc(): void {
  ipcMain.handle(IPC_CHANNELS.AUTH_LOGIN, (_event, data: unknown) => {
    const input = loginInputSchema.parse(data)
    return login(input.username, input.password)
  })

  ipcMain.handle(IPC_CHANNELS.AUTH_LOGOUT, () => {
    logout()
  })

  ipcMain.handle(IPC_CHANNELS.AUTH_GET_SESSION, () => {
    return getCurrentUser()
  })

  handleAuthenticated(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, (_event, newPassword: unknown) => {
    return changePassword(changePasswordInputSchema.parse(newPassword))
  })
}
