import { Schema, model, type HydratedDocument } from 'mongoose'
import type { Holiday } from '../../shared/holidays'

type HolidayDocument = Omit<Holiday, 'id'>

const holidaySchema = new Schema<HolidayDocument>(
  {
    date: { type: Date, required: true, unique: true },
    description: { type: String, required: false }
  },
  { collection: 'feriados' }
)

const HolidayModel = model<HolidayDocument>('Holiday', holidaySchema)

function toHoliday(doc: HydratedDocument<HolidayDocument>): Holiday {
  const { _id, date, description } = doc
  return { id: _id.toString(), date, description }
}

export async function createHoliday(data: HolidayDocument): Promise<Holiday> {
  const doc = await HolidayModel.create(data)
  return toHoliday(doc)
}

export async function listHolidays(): Promise<Holiday[]> {
  const docs = await HolidayModel.find().sort({ date: 1 })
  return docs.map(toHoliday)
}

export async function findHolidayByDate(date: Date): Promise<Holiday | null> {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
  const doc = await HolidayModel.findOne({ date: { $gte: startOfDay, $lt: endOfDay } })
  return doc ? toHoliday(doc) : null
}

export async function deleteHoliday(id: string): Promise<void> {
  await HolidayModel.findByIdAndDelete(id)
}
