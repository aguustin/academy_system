import { useEffect, useState } from 'react'
import { CheckCircle2, UserX } from 'lucide-react'
import type { StudentAtRiskItem, StudentRiskLevel } from '../../shared/attendance'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { PageHeader } from '../components/ui/page-header'
import { EmptyState } from '../components/ui/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'
import { normalizeText } from '../lib/utils'

const RISK_LABELS: Record<StudentRiskLevel, string> = {
  lost: 'Perdió la regularidad',
  'at-risk': 'En riesgo'
}

const RISK_BADGE_VARIANT: Record<StudentRiskLevel, 'destructive' | 'secondary'> = {
  lost: 'destructive',
  'at-risk': 'secondary'
}

export function StudentsAtRisk(): React.JSX.Element {
  const [items, setItems] = useState<StudentAtRiskItem[] | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    window.api.attendance.getStudentsAtRisk().then(setItems)
  }, [])

  const filteredItems = (items ?? []).filter((item) => {
    const query = normalizeText(search.trim())
    if (!query) return true
    return (
      normalizeText(item.studentName).includes(query) ||
      normalizeText(item.courseName).includes(query)
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alumnos en riesgo"
        description="Alumnos de ediciones activas que ya perdieron la regularidad o están por perderla, contando solo las clases ya dictadas."
      />

      {items === null ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No hay alumnos en riesgo"
          description="Ningún alumno de una edición activa está por debajo del mínimo de asistencia."
        />
      ) : (
        <div className="space-y-4">
          <Input
            placeholder="Buscar por alumno o curso..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-sm"
          />

          {filteredItems.length === 0 ? (
            <EmptyState icon={UserX} title="No se encontraron alumnos con ese criterio" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Faltas</TableHead>
                  <TableHead className="text-center">Restantes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={`${item.courseEditionId}-${item.studentId}`}>
                    <TableCell className="font-medium">{item.studentName}</TableCell>
                    <TableCell>{item.dni}</TableCell>
                    <TableCell>{item.courseName}</TableCell>
                    <TableCell>
                      <Badge variant={RISK_BADGE_VARIANT[item.riskLevel]}>
                        {RISK_LABELS[item.riskLevel]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.usedAbsences} / {item.allowedAbsences}
                    </TableCell>
                    <TableCell className="text-center">{item.remainingAbsences}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  )
}
