import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { backupDatabase } from '../services/backup-service'
import { handleAdminOnly } from '../auth/require-admin'

export function registerBackupIpc(): void {
  handleAdminOnly(IPC_CHANNELS.BACKUP_CREATE, () => {
    return backupDatabase()
  })
}
