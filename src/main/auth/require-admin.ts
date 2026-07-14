import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { getSession } from './session'

/**
 * Igual que `handleAuthenticated`, pero además exige rol admin.
 * Se mantiene separado para no tocar la infraestructura de sesión del Ticket 013.
 */
export function handleAdminOnly<Args extends unknown[], Result>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: Args) => Result
): void {
  ipcMain.handle(channel, (event, ...args: Args) => {
    const session = getSession()
    if (!session) {
      throw new Error('No hay una sesión activa')
    }
    if (session.role !== 'admin') {
      throw new Error('Esta acción requiere rol de administrador')
    }
    return handler(event, ...args)
  })
}
