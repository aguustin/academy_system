import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { getDashboardSummary } from '../services/dashboard-service'
import { handleAdminOnly } from '../auth/require-admin'

export function registerDashboardIpc(): void {
  handleAdminOnly(IPC_CHANNELS.DASHBOARD_GET_SUMMARY, () => {
    return getDashboardSummary()
  })
}
