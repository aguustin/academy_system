import { z } from 'zod'

export const holidaySchema = z.object({
  id: z.string(),
  date: z.date(),
  description: z.string().optional()
})
export type Holiday = z.infer<typeof holidaySchema>

export const holidayInputSchema = holidaySchema.omit({ id: true })
export type HolidayInput = z.infer<typeof holidayInputSchema>
