import type { Holiday, HolidayInput } from '../../shared/holidays'
import {
  createHoliday as createHolidayInDb,
  deleteHoliday as deleteHolidayInDb,
  findHolidayByDate,
  listHolidays as listHolidaysInDb
} from '../db/holiday'

export async function createHoliday(data: HolidayInput): Promise<Holiday> {
  const existing = await findHolidayByDate(data.date)
  if (existing) {
    throw new Error('Ya existe un feriado cargado para esa fecha')
  }
  return createHolidayInDb(data)
}

export function listHolidays(): Promise<Holiday[]> {
  return listHolidaysInDb()
}

export function deleteHoliday(id: string): Promise<void> {
  return deleteHolidayInDb(id)
}
