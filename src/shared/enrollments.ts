import { z } from 'zod'

// Situación de participación del alumno en la edición (distinto del resultado académico de
// certification-service.ts: un alumno puede "finished" y estar desaprobado académicamente).
export const enrollmentStatusSchema = z.enum(['in-progress', 'dropped', 'absent', 'finished'])
export type EnrollmentStatus = z.infer<typeof enrollmentStatusSchema>

// "Cursando" (no "En cursado") a propósito: evita que se confunda con el ESTADO académico de
// "Ver total de asistencias" (EN CURSADO/APROBADO/DESAPROBADO), que es un concepto distinto.
// Se comparte entre renderer (badge de estado) y main (export a Excel) para que ambos usen
// siempre el mismo texto.
export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  'in-progress': 'Cursando',
  dropped: 'Abandono',
  absent: 'No asistió',
  finished: 'Finalizó'
}

export const enrollmentSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  courseEditionId: z.string(),
  status: enrollmentStatusSchema.default('in-progress'),
  createdAt: z.date()
})
export type Enrollment = z.infer<typeof enrollmentSchema>

// Solo un alumno "en cursado" puede recibir asistencias o notas nuevas: Abandono, No asistió y
// Finalizó quedan bloqueados para nuevas asignaciones (conservan igual todo lo ya cargado).
export function canReceiveNewRecords(status: EnrollmentStatus): boolean {
  return status === 'in-progress'
}

// Para listados de asistencia de la edición: Abandono/No asistió se ocultan (ya no participan),
// pero Finalizó sigue mostrándose (su asistencia ya dictada sigue siendo un dato válido).
export function isWithdrawnFromCourse(status: EnrollmentStatus): boolean {
  return status === 'dropped' || status === 'absent'
}
