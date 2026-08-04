import { z } from 'zod'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { holidayInputSchema } from '../../shared/holidays'
import { createHoliday, deleteHoliday, listHolidays } from '../services/holiday-service'
import { handleAuthenticated } from '../auth/require-session'
import { handleAdminOnly } from '../auth/require-admin'

const idSchema = z.string()

export function registerHolidayIpc(): void {
  handleAuthenticated(IPC_CHANNELS.HOLIDAY_LIST, () => {
    return listHolidays()
  })

  handleAdminOnly(IPC_CHANNELS.HOLIDAY_CREATE, (_event, data: unknown) => {
    return createHoliday(holidayInputSchema.parse(data))
  })

  handleAdminOnly(IPC_CHANNELS.HOLIDAY_DELETE, (_event, id: unknown) => {
    return deleteHoliday(idSchema.parse(id))
  })
}
