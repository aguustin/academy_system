import type { ClassSession, GenerateClassSessionsResult } from '../../shared/class-sessions'
import type { DayOfWeek, Schedule } from '../../shared/courses'
import { findCourseEditionById } from '../db/course-edition'
import {
  createClassSessions as createClassSessionsInDb,
  listClassSessionsByEdition as listClassSessionsByEditionInDb
} from '../db/class-session'

const DAYS_OF_WEEK: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
]

interface SessionDate {
  date: Date
  startTime: string
  endTime: string
}

function toLocalDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function calculateSessionDates(
  startDate: Date,
  endDate: Date,
  schedules: Schedule[]
): SessionDate[] {
  const schedulesByDay = new Map<DayOfWeek, Schedule[]>()
  for (const schedule of schedules) {
    const list = schedulesByDay.get(schedule.dayOfWeek) ?? []
    list.push(schedule)
    schedulesByDay.set(schedule.dayOfWeek, list)
  }

  const sessions: SessionDate[] = []
  const start = toLocalDateOnly(startDate)
  const end = toLocalDateOnly(endDate)

  for (
    let current = start;
    current <= end;
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1)
  ) {
    const matchingSchedules = schedulesByDay.get(DAYS_OF_WEEK[current.getDay()]) ?? []
    for (const schedule of matchingSchedules) {
      sessions.push({
        date: new Date(current),
        startTime: schedule.startTime,
        endTime: schedule.endTime
      })
    }
  }

  return sessions
}

export async function generateClassSessions(
  courseEditionId: string
): Promise<GenerateClassSessionsResult> {
  const existing = await listClassSessionsByEditionInDb(courseEditionId)
  if (existing.length > 0) {
    return { status: 'already-exists', sessions: existing }
  }

  const courseEdition = await findCourseEditionById(courseEditionId)
  if (!courseEdition) {
    throw new Error('Edición no encontrada')
  }

  const sessionDates = calculateSessionDates(
    courseEdition.startDate,
    courseEdition.endDate,
    courseEdition.schedules
  )
  const sessions = await createClassSessionsInDb(
    sessionDates.map((sessionDate) => ({ courseEditionId, ...sessionDate }))
  )

  return { status: 'generated', sessions }
}

export function listClassSessionsByEdition(courseEditionId: string): Promise<ClassSession[]> {
  return listClassSessionsByEditionInDb(courseEditionId)
}
