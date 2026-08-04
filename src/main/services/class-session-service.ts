import type { ClassSession, GenerateClassSessionsResult } from '../../shared/class-sessions'
import type { DayOfWeek, Schedule } from '../../shared/courses'
import { findCourseEditionById } from '../db/course-edition'
import {
  createClassSessions as createClassSessionsInDb,
  deleteClassSession as deleteClassSessionInDb,
  findClassSessionById,
  listClassSessionsByEdition as listClassSessionsByEditionInDb
} from '../db/class-session'
import { listHolidays } from '../db/holiday'
import { findAttendanceByClassSession } from '../db/attendance'

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

function toDateKey(date: Date): string {
  return toLocalDateOnly(date).toISOString().slice(0, 10)
}

function calculateSessionDates(
  startDate: Date,
  endDate: Date,
  schedules: Schedule[],
  holidayDates: Set<string>
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
    // Un feriado no mueve la clase a otro día: directamente no se genera esa fecha.
    if (holidayDates.has(toDateKey(current))) continue

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

  const holidays = await listHolidays()
  const holidayDates = new Set(holidays.map((holiday) => toDateKey(holiday.date)))

  const sessionDates = calculateSessionDates(
    courseEdition.startDate,
    courseEdition.endDate,
    courseEdition.schedules,
    holidayDates
  )
  const sessions = await createClassSessionsInDb(
    sessionDates.map((sessionDate) => ({ courseEditionId, ...sessionDate }))
  )

  return { status: 'generated', sessions }
}

export function listClassSessionsByEdition(courseEditionId: string): Promise<ClassSession[]> {
  return listClassSessionsByEditionInDb(courseEditionId)
}

// Único mecanismo para cancelar una clase puntual: sirve tanto para cancelaciones manuales
// ad-hoc como para el caso de un feriado cargado después de generar las clases (no se borra
// la fecha automáticamente, ver calculateSessionDates). Se bloquea si ya hay asistencia
// registrada para no perder información histórica.
export async function cancelClassSession(id: string): Promise<void> {
  const classSession = await findClassSessionById(id)
  if (!classSession) {
    throw new Error('Clase no encontrada')
  }
  const attendanceRecords = await findAttendanceByClassSession(id)
  if (attendanceRecords.length > 0) {
    throw new Error('No se puede cancelar una clase que ya tiene asistencia registrada')
  }
  await deleteClassSessionInDb(id)
}
