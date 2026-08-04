// Tipos del resumen del Dashboard. Todo se calcula al vuelo a partir de datos ya existentes
// (ediciones, alumnos, clases, evaluaciones) — no se persiste nada nuevo.

export interface AttentionEditionItem {
  courseEditionId: string
  courseName: string
}

export interface AttentionEvaluationItem {
  evaluationId: string
  evaluationName: string
  courseEditionId: string
  courseName: string
}

export interface UpcomingClassItem {
  classSessionId: string
  courseEditionId: string
  courseName: string
  date: Date
  startTime: string
  endTime: string
}

export interface DashboardSummary {
  activeEditionsCount: number
  upcomingEditionsCount: number
  finishedEditionsCount: number
  totalStudentsCount: number
  editionsWithoutClasses: AttentionEditionItem[]
  editionsWithoutStudents: AttentionEditionItem[]
  evaluationsWithoutResults: AttentionEvaluationItem[]
  classesThisWeek: UpcomingClassItem[]
}
