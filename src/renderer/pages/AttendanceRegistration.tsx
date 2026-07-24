import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { StudentTodayClassOption } from '../../shared/attendance'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { FormField } from '../components/ui/form-field'

const AUTO_RETURN_MS = 3000

type KioskStep =
  | { type: 'dni' }
  | { type: 'not-found' }
  | { type: 'no-classes'; studentName: string }
  | { type: 'options'; studentId: string; studentName: string; options: StudentTodayClassOption[] }
  | { type: 'confirmed'; option: StudentTodayClassOption }
  | { type: 'already-registered'; option: StudentTodayClassOption }

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-AR')
}

export function AttendanceRegistration(): React.JSX.Element {
  const navigate = useNavigate()
  const [dni, setDni] = useState('')
  const [step, setStep] = useState<KioskStep>({ type: 'dni' })
  const [submitting, setSubmitting] = useState(false)

  function reset(): void {
    setStep({ type: 'dni' })
    setDni('')
  }

  useEffect(() => {
    if (step.type !== 'confirmed' && step.type !== 'already-registered') return
    const timeout = setTimeout(reset, AUTO_RETURN_MS)
    return () => clearTimeout(timeout)
  }, [step])

  async function handleSearch(event: FormEvent): Promise<void> {
    event.preventDefault()
    const trimmedDni = dni.trim()
    if (!trimmedDni) return

    setSubmitting(true)
    try {
      const result = await window.api.attendance.findTodayClasses(trimmedDni)
      if (result.status === 'student-not-found') {
        setStep({ type: 'not-found' })
        return
      }
      if (result.status === 'no-classes-today') {
        setStep({ type: 'no-classes', studentName: result.studentName })
        return
      }
      setStep({
        type: 'options',
        studentId: result.studentId,
        studentName: result.studentName,
        options: result.options
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRegister(studentId: string, option: StudentTodayClassOption): Promise<void> {
    setSubmitting(true)
    try {
      const result = await window.api.attendance.registerClass(option.classSessionId, studentId)
      setStep(
        result.status === 'registered'
          ? { type: 'confirmed', option }
          : { type: 'already-registered', option }
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background p-6 text-foreground">
      {step.type === 'dni' && (
        <Card className="w-full max-w-sm p-8">
          <form onSubmit={handleSearch} className="flex flex-col gap-5">
            <div className="space-y-1 text-center">
              <h1 className="text-xl font-semibold tracking-tight">Registrar asistencia</h1>
              <p className="text-sm text-muted-foreground">Ingresá tu DNI para continuar</p>
            </div>

            <FormField label="DNI" htmlFor="dni">
              <Input
                id="dni"
                autoFocus
                autoComplete="off"
                value={dni}
                disabled={submitting}
                onChange={(event) => setDni(event.target.value)}
              />
            </FormField>

            <Button type="submit" disabled={submitting || !dni.trim()} className="w-full">
              Buscar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate('/login')}
              disabled={submitting}
            >
              Volver
            </Button>
          </form>
        </Card>
      )}

      {step.type === 'not-found' && (
        <Card className="w-full max-w-sm space-y-4 p-8 text-center">
          <p className="text-sm text-destructive">No existe un alumno registrado con ese DNI.</p>
          <Button className="w-full" onClick={reset}>
            Volver a intentar
          </Button>
        </Card>
      )}

      {step.type === 'no-classes' && (
        <Card className="w-full max-w-sm space-y-4 p-8 text-center">
          <p className="font-medium text-foreground">{step.studentName}</p>
          <p className="text-sm text-muted-foreground">
            No tenés clases programadas para el día de hoy.
          </p>
          <Button className="w-full" onClick={reset}>
            Volver a intentar
          </Button>
        </Card>
      )}

      {step.type === 'options' && (
        <div className="w-full max-w-md space-y-4">
          <p className="text-center text-sm font-medium text-foreground">
            {step.studentName}: elegí el curso
          </p>
          {step.options.map((option) => (
            <Card key={option.classSessionId} className="space-y-2 p-6">
              <h3 className="font-semibold text-foreground">{option.courseName}</h3>
              <p className="text-sm text-muted-foreground">Profesor: {option.teacherName}</p>
              <p className="text-sm text-muted-foreground">
                {option.startTime} - {option.endTime}
              </p>
              <Button
                className="w-full"
                disabled={submitting}
                onClick={() => handleRegister(step.studentId, option)}
              >
                Registrar asistencia
              </Button>
            </Card>
          ))}
          <Button variant="outline" className="w-full" onClick={reset} disabled={submitting}>
            Cancelar
          </Button>
        </div>
      )}

      {step.type === 'confirmed' && (
        <Card className="w-full max-w-sm space-y-2 p-8 text-center">
          <p className="text-3xl text-success">✓</p>
          <p className="font-semibold text-foreground">Asistencia registrada correctamente</p>
          <p className="text-sm text-muted-foreground">Curso: {step.option.courseName}</p>
          <p className="text-sm text-muted-foreground">Fecha: {formatDate(step.option.date)}</p>
          <p className="text-sm text-muted-foreground">
            Horario: {step.option.startTime} - {step.option.endTime}
          </p>
        </Card>
      )}

      {step.type === 'already-registered' && (
        <Card className="w-full max-w-sm space-y-2 p-8 text-center">
          <p className="text-sm text-destructive">La asistencia ya fue registrada.</p>
          <p className="text-sm text-muted-foreground">Curso: {step.option.courseName}</p>
          <p className="text-sm text-muted-foreground">
            Horario: {step.option.startTime} - {step.option.endTime}
          </p>
        </Card>
      )}
    </div>
  )
}
