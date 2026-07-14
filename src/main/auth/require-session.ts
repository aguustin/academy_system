import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { getSession } from './session'

/**
 * Registra un handler IPC que solo se ejecuta si existe una sesión activa.
 * Reemplaza a `ipcMain.handle` para todo canal que no deba ser accesible sin login.
 */
export function handleAuthenticated<Args extends unknown[], Result>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: Args) => Result
): void {
  ipcMain.handle(channel, (event, ...args: Args) => {
    if (!getSession()) {
      throw new Error('No hay una sesión activa')
    }
    return handler(event, ...args)
  })
}
