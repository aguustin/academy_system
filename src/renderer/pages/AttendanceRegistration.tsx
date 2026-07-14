import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { AttendanceEditionOption, RegisterAttendanceResult } from '../../shared/attendance'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

type ViewState =
  | { type: 'idle' }
  | { type: 'select'; dni: string; studentName: string; options: AttendanceEditionOption[] }
  | { type: 'result'; result: RegisterAttendanceResult }

export function AttendanceRegistration(): React.JSX.Element {
  const [dni, setDni] = useState('')
  const [state, setState] = useState<ViewState>({ type: 'idle' })
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.type !== 'select') {
      inputRef.current?.focus()
    }
  }, [state])

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    const trimmedDni = dni.trim()
    if (!trimmedDni) return

    setSubmitting(true)
    const result = await window.api.attendance.register(trimmedDni)
    setSubmitting(false)

    if (result.status === 'select-edition') {
      setState({
        type: 'select',
        dni: trimmedDni,
        studentName: result.studentName,
        options: result.options
      })
      return
    }

    setState({ type: 'result', result })
    setDni('')
  }

  async function handleSelectEdition(courseEditionId: string): Promise<void> {
    if (state.type !== 'select') return
    setSubmitting(true)
    const result = await window.api.attendance.register(state.dni, courseEditionId)
    setSubmitting(false)
    setState({ type: 'result', result })
    setDni('')
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-12">
      <h1 className="text-2xl font-semibold">Registro de asistencia</h1>

      {state.type === 'select' ? (
        <div className="w-full space-y-3 text-center">
          <p>{state.studentName}: elegí el curso</p>
          <div className="flex flex-col gap-2">
            {state.options.map((option, index) => (
              <Button
                key={option.courseEditionId}
                autoFocus={index === 0}
                onClick={() => handleSelectEdition(option.courseEditionId)}
              >
                {option.courseName}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-4">
          <div className="w-full space-y-1">
            <label htmlFor="dni" className="text-sm font-medium">
              DNI
            </label>
            <Input
              id="dni"
              ref={inputRef}
              autoComplete="off"
              value={dni}
              disabled={submitting}
              onChange={(event) => setDni(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={submitting || !dni.trim()} className="w-full">
            Registrar
          </Button>
        </form>
      )}

      {state.type === 'result' && (
        <div className="w-full space-y-1 rounded-md border border-border p-4 text-center">
          {state.result.status === 'registered' && (
            <>
              <p className="font-medium">{state.result.studentName}</p>
              <p className="text-muted-foreground">{state.result.courseName}</p>
              <p className="text-muted-foreground">Hora: {state.result.time}</p>
            </>
          )}
          {state.result.status === 'already-registered' && (
            <p className="text-destructive">La asistencia ya fue registrada hoy.</p>
          )}
          {state.result.status === 'student-not-found' && (
            <p className="text-destructive">No se encontró ningún alumno con ese DNI.</p>
          )}
          {state.result.status === 'no-active-enrollment' && (
            <p className="text-destructive">
              {state.result.studentName} no tiene inscripciones activas.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
