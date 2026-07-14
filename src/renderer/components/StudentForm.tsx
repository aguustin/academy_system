import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { studentSchema, type Student } from '../../shared/students'
import { Button } from './ui/button'
import { Input } from './ui/input'

const studentFormSchema = studentSchema.omit({ id: true })
type StudentFormValues = z.infer<typeof studentFormSchema>

interface StudentFormProps {
  initialValues?: Student
  onSubmit: (values: StudentFormValues) => Promise<void>
  onCancel: () => void
}

export function StudentForm({
  initialValues,
  onSubmit,
  onCancel
}: StudentFormProps): React.JSX.Element {
  const [values, setValues] = useState<StudentFormValues>({
    dni: initialValues?.dni ?? '',
    firstName: initialValues?.firstName ?? '',
    lastName: initialValues?.lastName ?? ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()

    const result = studentFormSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      await onSubmit(result.data)
    } catch (error) {
      setErrors({ dni: error instanceof Error ? error.message : 'No se pudo guardar el alumno.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="dni" className="text-sm font-medium">
          DNI
        </label>
        <Input
          id="dni"
          value={values.dni}
          onChange={(event) => setValues({ ...values, dni: event.target.value })}
        />
        {errors.dni && <p className="text-sm text-destructive">{errors.dni}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="firstName" className="text-sm font-medium">
          Nombre
        </label>
        <Input
          id="firstName"
          value={values.firstName}
          onChange={(event) => setValues({ ...values, firstName: event.target.value })}
        />
        {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="lastName" className="text-sm font-medium">
          Apellido
        </label>
        <Input
          id="lastName"
          value={values.lastName}
          onChange={(event) => setValues({ ...values, lastName: event.target.value })}
        />
        {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {initialValues ? 'Guardar' : 'Crear'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
