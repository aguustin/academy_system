import type {
  AddClassSessionInput,
  ClassSession,
  GenerateClassSessionsResult
} from '../../shared/class-sessions'
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

// CourseEdition.startDate/endDate se arman en el formulario a partir de un <input type="date">
// (`new Date("YYYY-MM-DD")`), que JS interpreta como medianoche UTC. En husos horarios negativos
// (ej. Argentina) los getters locales de esa fecha caen un día antes del día calendario elegido
// por el usuario. Se leen con getters UTC para recuperar el día real, y se representan en
// medianoche local para poder compararlas con `current` (construido en hora local dentro del loop).
function toUtcDateOnly(date: Date): Date {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
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
  const start = toUtcDateOnly(startDate)
  const end = toUtcDateOnly(endDate)

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

// Complemento manual de "Generar clases": cubre tanto el caso general (agregar una fecha que
// haga falta) como el de ediciones que ya generaron sus clases con el rango recortado por el
// bug de fechas ya corregido (no se recalculan retroactivamente, ver calculateSessionDates).
// No hace falta propagar nada más: las estadísticas de asistencia (computeAttendanceStats) y
// todo lo que depende de ellas se recalculan siempre a partir de las clases existentes en ese
// momento, así que la nueva fecha queda reflejada automáticamente en cuanto se guarda.
export async function addClassSession(data: AddClassSessionInput): Promise<ClassSession> {
  const courseEdition = await findCourseEditionById(data.courseEditionId)
  if (!courseEdition) {
    throw new Error('Edición no encontrada')
  }
  const [session] = await createClassSessionsInDb([data])
  return session
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
