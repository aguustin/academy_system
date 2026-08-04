import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarClock, CheckCircle2 } from 'lucide-react'
import type { DashboardSummary } from '../../shared/dashboard'
import { Card } from '../components/ui/card'
import { PageHeader } from '../components/ui/page-header'
import { Button } from '../components/ui/button'
import { EmptyState } from '../components/ui/empty-state'

function formatClassDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

interface StatCardProps {
  label: string
  value: number
}

function StatCard({ label, value }: StatCardProps): React.JSX.Element {
  return (
    <Card className="space-y-1 p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
    </Card>
  )
}

export function Dashboard(): React.JSX.Element {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  useEffect(() => {
    window.api.dashboard.getSummary().then(setSummary)
  }, [])

  if (summary === null) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  const hasAttentionItems =
    summary.editionsWithoutClasses.length > 0 ||
    summary.editionsWithoutStudents.length > 0 ||
    summary.evaluationsWithoutResults.length > 0

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Ediciones activas" value={summary.activeEditionsCount} />
        <StatCard label="Ediciones próximas" value={summary.upcomingEditionsCount} />
        <StatCard label="Ediciones finalizadas" value={summary.finishedEditionsCount} />
        <StatCard label="Alumnos registrados" value={summary.totalStudentsCount} />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Atención requerida</h2>

        {!hasAttentionItems ? (
          <EmptyState
            icon={CheckCircle2}
            title="Todo al día"
            description="No hay ediciones activas con pendientes en este momento."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summary.editionsWithoutClasses.length > 0 && (
              <Card className="space-y-2 p-5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0 text-destructive" />
                  <p className="text-sm font-medium text-foreground">Sin clases generadas</p>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {summary.editionsWithoutClasses.map((item) => (
                    <li key={item.courseEditionId}>{item.courseName}</li>
                  ))}
                </ul>
              </Card>
            )}

            {summary.editionsWithoutStudents.length > 0 && (
              <Card className="space-y-2 p-5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0 text-destructive" />
                  <p className="text-sm font-medium text-foreground">Sin alumnos inscriptos</p>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {summary.editionsWithoutStudents.map((item) => (
                    <li key={item.courseEditionId}>{item.courseName}</li>
                  ))}
                </ul>
              </Card>
            )}

            {summary.evaluationsWithoutResults.length > 0 && (
              <Card className="space-y-2 p-5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0 text-destructive" />
                  <p className="text-sm font-medium text-foreground">Evaluaciones sin resultados</p>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {summary.evaluationsWithoutResults.map((item) => (
                    <li key={item.evaluationId}>
                      {item.evaluationName} — {item.courseName}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}

        {hasAttentionItems && (
          <Button variant="outline" size="sm" onClick={() => navigate('/ediciones')}>
            Ir a Ediciones
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Próximas clases (7 días)
        </h2>
        {summary.classesThisWeek.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No hay clases programadas para los próximos 7 días"
          />
        ) : (
          <Card className="max-h-[500px] divide-y divide-border overflow-auto">
            {summary.classesThisWeek.map((item) => (
              <div
                key={item.classSessionId}
                className="flex items-center justify-between gap-3 p-4 text-sm"
              >
                <span className="font-medium text-foreground">{item.courseName}</span>
                <span className="text-muted-foreground">
                  {formatClassDate(item.date)} · {item.startTime} - {item.endTime}
                </span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  )
}
