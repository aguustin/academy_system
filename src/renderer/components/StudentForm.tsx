import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { studentSchema, type Student } from '../../shared/students'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'
import { FormField } from './ui/form-field'

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
    <Card className="max-w-md p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField label="DNI" htmlFor="dni" error={errors.dni}>
          <Input
            id="dni"
            value={values.dni}
            onChange={(event) => setValues({ ...values, dni: event.target.value })}
          />
        </FormField>

        <FormField label="Nombre" htmlFor="firstName" error={errors.firstName}>
          <Input
            id="firstName"
            value={values.firstName}
            onChange={(event) => setValues({ ...values, firstName: event.target.value })}
          />
        </FormField>

        <FormField label="Apellido" htmlFor="lastName" error={errors.lastName}>
          <Input
            id="lastName"
            value={values.lastName}
            onChange={(event) => setValues({ ...values, lastName: event.target.value })}
          />
        </FormField>

        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={submitting}>
            {initialValues ? 'Guardar' : 'Crear'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}
